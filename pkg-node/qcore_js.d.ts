/* tslint:disable */
/* eslint-disable */

export function account_body(address: string): string;

export function address(seed_hex: string, index: bigint): string;

export function block_by_height_body(height: bigint): string;

export function buildSignedOrderCall(contract: string, selector_hex: string, scheme_off: bigint, ptr_off: bigint, field_offs_csv: string, fields_csv: string, region_off: bigint, owner_seed_hex: string, owner_index: bigint, nonce: bigint): string;

export function contractAddress(deployer: string, nonce: bigint): string | undefined;

export function eventsBody(height: bigint): string;

export function mapSlotKey(map_domain_tag: bigint, key_address_hex: string): string;

export function mnemonicFromSeed(seed_hex: string): string;

export function nonceSlotKey(signer_hex: string): string;

export function orderSigner(seed_hex: string, index: bigint): string;

export function parseEvents(response: string): string;

export function scalarSlotKey(slot: bigint): string;

export function seedFromMnemonic(phrase: string): string;

export function signRegister(seed_hex: string, index: bigint, nonce: bigint, fee: string): string;

export function sign_call(seed_hex: string, index: bigint, target: string, args_hex: string, nonce: bigint, meter_limit: bigint, fee: string): string;

export function sign_transfer(seed_hex: string, index: bigint, to: string, amount: string, nonce: bigint, fee: string): string;

export function storageBody(contract: string): string;

export function storageValue(response: string, slot_key_hex: string): string;

export function submit_body(tx_hex: string): string;

export function transaction_body(tx_id: string): string;

export function valid_address(address: string): boolean;

export function vmDeployAddress(): string;
