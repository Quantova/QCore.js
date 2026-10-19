/* tslint:disable */
/* eslint-disable */

export class SigningSession {
    free(): void;
    [Symbol.dispose](): void;
    checkTarget(address: string): void;
    exportState(): string;
    importState(state: string): void;
    isHeld(key: string, slot: bigint): boolean;
    constructor(book: string[]);
    nextNonce(key: string): bigint | undefined;
    outcome(key: string, slot: bigint, accepted: boolean): void;
    release(key: string, slot: bigint): void;
    releasePending(key: string): void;
    rememberAddress(address: string): void;
    signed(key: string, slot: bigint): void;
    slot(key: string, reported: bigint, expected: bigint | null | undefined, order: boolean): bigint;
}

export function account_body(address: string): string;

export function address(seed_bytes: Uint8Array, index: bigint): string;

export function assetBalanceBody(issuer: string, holder: string): string;

export function assetSupplyBody(issuer: string): string;

export function block_by_height_body(height: bigint): string;

export function boundedValidUntil(chain_name: string, head: bigint, wall_secs: bigint, floor: bigint | null | undefined, floor_age_secs: bigint): bigint;

export function buildSignedOrderCall(chain_id: bigint, contract: string, selector_hex: string, layout_hash_hex: string, scheme_off: bigint, ptr_off: bigint, expiry_off: bigint, field_offs_csv: string, fields_csv: string, region_off: bigint, owner_seed_bytes: Uint8Array, owner_index: bigint, nonce: bigint, expiry: bigint): string;

export function buildTypedOrderCall(chain_id: bigint, contract: string, selector_hex: string, layout_hash_hex: string, scheme_off: bigint, ptr_off: bigint, expiry_off: bigint, region_off: bigint, fields_json: string, owner_seed_bytes: Uint8Array, owner_index: bigint, nonce: bigint, expiry: bigint): string;

export function chainIdFromName(name: string): bigint;

export function checkGatewayJson(response: string): void;

export function checkOrderExpiry(expiry: bigint, now_secs: bigint): void;

export function checkValidUntil(valid_until: bigint, head: bigint): void;

export function contractAddress(deployer: string, nonce: bigint): string | undefined;

export function decodeEvent(leaf_hex: string): string;

export function eventsBody(height: bigint): string;

export function gatewayProtocol(): number;

export function genesisSecs(chain_name: string): bigint;

export function headCeiling(chain_name: string, wall_secs: bigint): bigint;

export function localChainId(): bigint;

export function lookalikeOf(candidate: string, known: string[]): string | undefined;

export function mainnetChainId(): bigint;

export function mainnetGenesisHash(): string | undefined;

export function mainnetRosterCommitment(): string | undefined;

export function mapAddrWordKey(map_domain_tag: bigint, key32_hex: string, word: bigint): string;

export function mapSlotKey(map_domain_tag: bigint, key_address_hex: string): string;

export function mnemonicFromSeed(seed_bytes: Uint8Array): Uint8Array;

export function mnemonicFromSeedText(seed_bytes: Uint8Array): any;

export function nameKey(label: string): string;

export function nonceSlotKey(signer_hex: string): string;

export function orderLayoutHash(selector_hex: string, fields_json: string): string;

export function orderSigner(seed_bytes: Uint8Array, index: bigint): string;

export function packSymbol(symbol: string): bigint;

export function parseEvents(response: string): string;

export function rosterCommitment(epoch: bigint, roster_json: string): string;

export function sameAddress(a: string, b: string): boolean;

export function scalarSlotKey(slot: bigint): string;

export function seedFromMnemonic(phrase: string): Uint8Array;

export function seedFromMnemonicBytes(phrase: Uint8Array): Uint8Array;

export function signAssetCall(seed_bytes: Uint8Array, index: bigint, target: string, args_hex: string, asset_issuer: string, amount: string, nonce: bigint, meter_limit: bigint, fee: string, chain_id: bigint, valid_until: bigint, transfer_fee: string | null | undefined, head: bigint, genesis_hex: string): string;

export function signPayableCall(seed_bytes: Uint8Array, index: bigint, target: string, args_hex: string, nonce: bigint, meter_limit: bigint, fee: string, value: string, chain_id: bigint, valid_until: bigint, transfer_fee: string | null | undefined, head: bigint, genesis_hex: string): string;

export function signRegister(seed_bytes: Uint8Array, index: bigint, nonce: bigint, fee: string, chain_id: bigint, valid_until: bigint, head: bigint, genesis_hex: string): string;

export function sign_call(seed_bytes: Uint8Array, index: bigint, target: string, args_hex: string, nonce: bigint, meter_limit: bigint, fee: string, chain_id: bigint, valid_until: bigint, transfer_fee: string | null | undefined, head: bigint, genesis_hex: string): string;

export function sign_transfer(seed_bytes: Uint8Array, index: bigint, to: string, amount: string, nonce: bigint, fee: string, chain_id: bigint, valid_until: bigint, head: bigint, genesis_hex: string): string;

export function storageBody(contract: string): string;

export function storageValue(response: string, slot_key_hex: string): string;

export function storageValueReported(response: string, slot_key_hex: string): string | undefined;

export function submit_body(tx_hex: string): string;

export function testnetChainId(): bigint;

export function testnetChainName(): string;

export function testnetGenesisHash(): string | undefined;

export function testnetRosterCommitment(): string | undefined;

export function testnetRpcUrl(): string;

export function tokenDecimalsSlot(): bigint;

export function tokenSymbolSlot(): bigint;

export function transaction_body(tx_id: string): string;

export function unpackSymbol(word: bigint): string;

export function valid_address(address: string): boolean;

export function validityBlocks(): bigint;

export function verifyAccount(chain_id: bigint, genesis_hex: string, epoch: bigint, roster_json: string, address: string, header_hex: string, certificate_hex: string, proof_hex: string): string;

export function verifyEvent(event_root_hex: string, leaf_hex: string, steps_json: string): boolean;

export function verifyFinality(chain_id: bigint, genesis_hex: string, header_hex: string, certificate_hex: string, roster_json: string): string;

export function verifyNextRoster(chain_id: bigint, genesis_hex: string, current_epoch: bigint, current_roster_json: string, header_hex: string, certificate_hex: string, next_roster_json: string, proof_hex: string): bigint;

export function verifyTransaction(transaction_root_hex: string, tx_id: string, leaf_hex: string, steps_json: string): boolean;

export function vmCallFee(transfer_fee: string, meter_limit: bigint): string;

export function vmDeployAddress(): string;
