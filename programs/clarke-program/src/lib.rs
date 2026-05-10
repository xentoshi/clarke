use anchor_lang::{prelude::*, system_program};

declare_id!("3KFUjEeu7efYuvLuAvEeKQqVt3pyoghUafoPSWzYif57");

const PRECISION: u128 = 1_000_000_000;

#[program]
pub mod clarke_program {
    use super::*;

    /// One-time initialization. Sets the program-wide admin authority.
    /// Will fail if called a second time (init ensures the PDA can only be
    /// created once).
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.authority.admin = ctx.accounts.admin.key();
        ctx.accounts.authority.bump = ctx.bumps.authority;
        Ok(())
    }

    /// Admin transfers the program authority to a new address.
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_admin: Pubkey) -> Result<()> {
        ctx.accounts.authority.admin = new_admin;
        Ok(())
    }

    /// Admin creates a tokenized offering for an orbital slot.
    /// Gated by the global ProgramAuthority — no other wallet can call this.
    pub fn create_offering(
        ctx: Context<CreateOffering>,
        slot_id: String,
        longitude_x10: i32,
        itu_ref: String,
        total_tokens: u64,
        token_price_lamports: u64,
        yield_share_bps: u16,
    ) -> Result<()> {
        require!(slot_id.len() <= 32, ClarkeError::StringTooLong);
        require!(itu_ref.len() <= 64, ClarkeError::StringTooLong);
        require!(total_tokens > 0, ClarkeError::InvalidAmount);
        require!(token_price_lamports > 0, ClarkeError::InvalidAmount);
        require!(yield_share_bps <= 10_000, ClarkeError::InvalidBps);

        let o = &mut ctx.accounts.offering;
        o.admin = ctx.accounts.admin.key();
        o.treasury = ctx.accounts.treasury.key();
        o.slot_id = slot_id;
        o.longitude_x10 = longitude_x10;
        o.itu_ref = itu_ref;
        o.total_tokens = total_tokens;
        o.token_price_lamports = token_price_lamports;
        o.sold_tokens = 0;
        o.yield_share_bps = yield_share_bps;
        o.yield_per_token_acc = 0;
        o.total_yield_distributed = 0;
        o.status = OfferingStatus::Active;
        o.bump = ctx.bumps.offering;
        Ok(())
    }

    /// Investor buys tokens. SOL goes directly to the operator treasury.
    pub fn invest(ctx: Context<Invest>, token_amount: u64) -> Result<()> {
        require!(token_amount > 0, ClarkeError::InvalidAmount);
        require!(
            ctx.accounts.offering.status == OfferingStatus::Active,
            ClarkeError::OfferingNotActive
        );

        let offering = &mut ctx.accounts.offering;
        let available = offering
            .total_tokens
            .checked_sub(offering.sold_tokens)
            .ok_or(ClarkeError::Overflow)?;
        require!(token_amount <= available, ClarkeError::SoldOut);

        let cost = offering
            .token_price_lamports
            .checked_mul(token_amount)
            .ok_or(ClarkeError::Overflow)?;

        // SOL → operator treasury immediately
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.investor.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            cost,
        )?;

        // Settle pending yield before changing token balance
        let pos = &mut ctx.accounts.position;
        if pos.tokens > 0 {
            let pending = pending_yield(pos, offering)?;
            pos.yield_claimable = pos
                .yield_claimable
                .checked_add(pending)
                .ok_or(ClarkeError::Overflow)?;
        }

        pos.investor = ctx.accounts.investor.key();
        pos.offering = offering.key();
        pos.tokens = pos
            .tokens
            .checked_add(token_amount)
            .ok_or(ClarkeError::Overflow)?;
        pos.invested_lamports = pos
            .invested_lamports
            .checked_add(cost)
            .ok_or(ClarkeError::Overflow)?;
        pos.yield_debt = yield_debt(pos.tokens, offering.yield_per_token_acc)?;
        pos.bump = ctx.bumps.position;

        offering.sold_tokens = offering
            .sold_tokens
            .checked_add(token_amount)
            .ok_or(ClarkeError::Overflow)?;

        emit!(InvestEvent {
            investor: ctx.accounts.investor.key(),
            slot_id: offering.slot_id.clone(),
            tokens: token_amount,
            lamports: cost,
        });
        Ok(())
    }

    /// Admin deposits transponder lease revenue into the offering PDA.
    /// The yield_share_bps portion accumulates for token holders to claim.
    pub fn distribute_yield(ctx: Context<DistributeYield>, amount: u64) -> Result<()> {
        require!(amount > 0, ClarkeError::InvalidAmount);
        require!(ctx.accounts.offering.sold_tokens > 0, ClarkeError::NoTokensSold);

        let yield_share_bps = ctx.accounts.offering.yield_share_bps;
        let sold_tokens = ctx.accounts.offering.sold_tokens;

        let holder_share = (amount as u128)
            .checked_mul(yield_share_bps as u128)
            .ok_or(ClarkeError::Overflow)?
            .checked_div(10_000)
            .ok_or(ClarkeError::Overflow)? as u64;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.distributor.to_account_info(),
                    to: ctx.accounts.offering.to_account_info(),
                },
            ),
            holder_share,
        )?;

        let added = (holder_share as u128)
            .checked_mul(PRECISION)
            .ok_or(ClarkeError::Overflow)?
            .checked_div(sold_tokens as u128)
            .ok_or(ClarkeError::Overflow)?;

        let offering = &mut ctx.accounts.offering;
        offering.yield_per_token_acc = offering
            .yield_per_token_acc
            .checked_add(added)
            .ok_or(ClarkeError::Overflow)?;
        offering.total_yield_distributed = offering
            .total_yield_distributed
            .checked_add(holder_share)
            .ok_or(ClarkeError::Overflow)?;

        emit!(YieldDistributedEvent {
            slot_id: offering.slot_id.clone(),
            amount: holder_share,
        });
        Ok(())
    }

    /// Investor claims their accumulated yield from the offering PDA.
    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        let pending = pending_yield(&ctx.accounts.position, &ctx.accounts.offering)?;
        let claimable = ctx.accounts.position
            .yield_claimable
            .checked_add(pending)
            .ok_or(ClarkeError::Overflow)?;
        require!(claimable > 0, ClarkeError::NoYieldAvailable);

        // Guard: never drain the offering PDA below its rent-exempt minimum.
        // Yield SOL = total lamports − rent-exempt minimum.
        let offering_info = ctx.accounts.offering.to_account_info();
        let rent = Rent::get()?;
        let rent_minimum = rent.minimum_balance(offering_info.data_len());
        let available_yield = offering_info
            .lamports()
            .checked_sub(rent_minimum)
            .ok_or(ClarkeError::InsufficientYieldBalance)?;
        require!(claimable <= available_yield, ClarkeError::InsufficientYieldBalance);

        let acc = ctx.accounts.offering.yield_per_token_acc;
        let slot_id = ctx.accounts.offering.slot_id.clone();

        let pos = &mut ctx.accounts.position;
        pos.yield_claimable = 0;
        pos.yield_debt = yield_debt(pos.tokens, acc)?;
        pos.yield_claimed = pos
            .yield_claimed
            .checked_add(claimable)
            .ok_or(ClarkeError::Overflow)?;

        **ctx.accounts.offering.to_account_info().try_borrow_mut_lamports()? -= claimable;
        **ctx.accounts.investor.try_borrow_mut_lamports()? += claimable;

        emit!(YieldClaimedEvent {
            investor: ctx.accounts.investor.key(),
            slot_id,
            amount: claimable,
        });
        Ok(())
    }

    /// Admin pauses or closes an offering.
    pub fn set_offering_status(
        ctx: Context<SetOfferingStatus>,
        status: OfferingStatus,
    ) -> Result<()> {
        ctx.accounts.offering.status = status;
        Ok(())
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn pending_yield(pos: &InvestorPosition, offering: &SlotOffering) -> Result<u64> {
    if pos.tokens == 0 {
        return Ok(0);
    }
    let gross = (pos.tokens as u128)
        .checked_mul(offering.yield_per_token_acc)
        .ok_or(ClarkeError::Overflow)?
        .checked_div(PRECISION)
        .ok_or(ClarkeError::Overflow)?;
    Ok(gross.saturating_sub(pos.yield_debt) as u64)
}

fn yield_debt(tokens: u64, acc: u128) -> Result<u128> {
    (tokens as u128)
        .checked_mul(acc)
        .ok_or(error!(ClarkeError::Overflow))
        .map(|v| v / PRECISION)
}

// ── Account contexts ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,                          // fails if already exists — prevents re-initialization
        payer = admin,
        space = ProgramAuthority::SPACE,
        seeds = [b"authority"],
        bump,
    )]
    pub authority: Account<'info, ProgramAuthority>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"authority"],
        bump = authority.bump,
        constraint = authority.admin == admin.key() @ ClarkeError::Unauthorized,
    )]
    pub authority: Account<'info, ProgramAuthority>,
}

#[derive(Accounts)]
#[instruction(slot_id: String)]
pub struct CreateOffering<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Verified against the global ProgramAuthority — only the admin can create offerings.
    #[account(
        seeds = [b"authority"],
        bump = authority.bump,
        constraint = authority.admin == admin.key() @ ClarkeError::Unauthorized,
    )]
    pub authority: Account<'info, ProgramAuthority>,

    /// CHECK: operator wallet — receives raised SOL directly
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = SlotOffering::space(&slot_id),
        seeds = [b"offering", slot_id.as_bytes()],
        bump,
    )]
    pub offering: Account<'info, SlotOffering>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Invest<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"offering", offering.slot_id.as_bytes()],
        bump = offering.bump,
    )]
    pub offering: Account<'info, SlotOffering>,

    /// CHECK: must match offering.treasury
    #[account(
        mut,
        constraint = treasury.key() == offering.treasury @ ClarkeError::WrongTreasury,
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = investor,
        space = InvestorPosition::SPACE,
        seeds = [b"position", investor.key().as_ref(), offering.key().as_ref()],
        bump,
    )]
    pub position: Account<'info, InvestorPosition>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeYield<'info> {
    #[account(mut)]
    pub distributor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"offering", offering.slot_id.as_bytes()],
        bump = offering.bump,
        constraint = offering.admin == distributor.key() @ ClarkeError::Unauthorized,
    )]
    pub offering: Account<'info, SlotOffering>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"offering", offering.slot_id.as_bytes()],
        bump = offering.bump,
    )]
    pub offering: Account<'info, SlotOffering>,

    #[account(
        mut,
        seeds = [b"position", investor.key().as_ref(), offering.key().as_ref()],
        bump = position.bump,
        constraint = position.investor == investor.key() @ ClarkeError::Unauthorized,
    )]
    pub position: Account<'info, InvestorPosition>,
}

#[derive(Accounts)]
pub struct SetOfferingStatus<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"offering", offering.slot_id.as_bytes()],
        bump = offering.bump,
        constraint = offering.admin == admin.key() @ ClarkeError::Unauthorized,
    )]
    pub offering: Account<'info, SlotOffering>,
}

// ── State ──────────────────────────────────────────────────────────────────────

#[account]
pub struct ProgramAuthority {
    pub admin: Pubkey, // 32
    pub bump: u8,      // 1
}

impl ProgramAuthority {
    pub const SPACE: usize = 8 + 32 + 1;
}

#[account]
pub struct SlotOffering {
    pub admin: Pubkey,                  // 32
    pub treasury: Pubkey,               // 32
    pub slot_id: String,                // 4 + up to 32
    pub longitude_x10: i32,             // 4
    pub itu_ref: String,                // 4 + 64
    pub total_tokens: u64,              // 8
    pub token_price_lamports: u64,      // 8
    pub sold_tokens: u64,               // 8
    pub yield_share_bps: u16,           // 2
    pub yield_per_token_acc: u128,      // 16
    pub total_yield_distributed: u64,   // 8
    pub status: OfferingStatus,         // 1
    pub bump: u8,                       // 1
}

impl SlotOffering {
    pub fn space(slot_id: &str) -> usize {
        8 + 32 + 32 + (4 + slot_id.len().min(32)) + 4 + (4 + 64) + 8 + 8 + 8 + 2 + 16 + 8 + 1 + 1
    }
}

#[account]
pub struct InvestorPosition {
    pub investor: Pubkey,       // 32
    pub offering: Pubkey,       // 32
    pub tokens: u64,            // 8
    pub invested_lamports: u64, // 8
    pub yield_debt: u128,       // 16
    pub yield_claimable: u64,   // 8
    pub yield_claimed: u64,     // 8
    pub bump: u8,               // 1
}

impl InvestorPosition {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 16 + 8 + 8 + 1;
}

// ── Enums ──────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OfferingStatus {
    Active,
    Paused,
    Closed,
}

// ── Events ──────────────────────────────────────────────────────────────────────

#[event]
pub struct InvestEvent {
    pub investor: Pubkey,
    pub slot_id: String,
    pub tokens: u64,
    pub lamports: u64,
}

#[event]
pub struct YieldDistributedEvent {
    pub slot_id: String,
    pub amount: u64,
}

#[event]
pub struct YieldClaimedEvent {
    pub investor: Pubkey,
    pub slot_id: String,
    pub amount: u64,
}

// ── Errors ──────────────────────────────────────────────────────────────────────

#[error_code]
pub enum ClarkeError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Basis points must be <= 10,000")]
    InvalidBps,
    #[msg("This offering is not active")]
    OfferingNotActive,
    #[msg("All tokens have been sold")]
    SoldOut,
    #[msg("No tokens have been sold yet")]
    NoTokensSold,
    #[msg("No yield available to claim")]
    NoYieldAvailable,
    #[msg("Yield vault balance insufficient — would drain below rent-exempt minimum")]
    InsufficientYieldBalance,
    #[msg("Treasury does not match the offering")]
    WrongTreasury,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("String too long")]
    StringTooLong,
    #[msg("Arithmetic overflow")]
    Overflow,
}
