// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

use qtv_wipe::{Zeroize, Zeroizing};
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
mod wipe_on_free {
    use std::alloc::{GlobalAlloc, Layout, System};

    use qtv_wipe::Zeroize;

    struct WipeOnFree;

    unsafe impl GlobalAlloc for WipeOnFree {
        unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
            unsafe { System.alloc(layout) }
        }

        unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
            unsafe {
                std::slice::from_raw_parts_mut(ptr, layout.size()).zeroize();
                System.dealloc(ptr, layout)
            }
        }
    }

    #[global_allocator]
    static ALLOCATOR: WipeOnFree = WipeOnFree;
}

fn seed(bytes: &[u8]) -> Result<Zeroizing<[u8; 32]>, JsError> {
    if bytes.len() != 32 {
        return Err(JsError::new("a seed is 32 raw bytes (a Uint8Array)"));
    }
    let mut seed = Zeroizing::new([0u8; 32]);
    seed.copy_from_slice(bytes);
    Ok(seed)
}

fn whole(value: &str, label: &str) -> Result<u128, JsError> {
    if value.is_empty() || !value.bytes().all(|b| b.is_ascii_digit()) {
        return Err(JsError::new(&format!("{label} is a whole number string")));
    }
    value
        .parse()
        .map_err(|_| JsError::new(&format!("{label} is out of range")))
}

fn whole_u64(value: &str, label: &str) -> Result<u64, JsError> {
    u64::try_from(whole(value, label)?)
        .map_err(|_| JsError::new(&format!("{label} is out of range")))
}

fn transfer_fee(value: Option<String>) -> Result<u128, JsError> {
    let value = value.ok_or_else(|| {
        JsError::new("pass the transfer fee the gateway reports, so a call is never signed below the fee its meter limit costs")
    })?;
    whole(&value, "transfer fee")
}

fn signed_json(signed: qcore::SignedTransfer) -> String {
    qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render()
}

#[wasm_bindgen]
pub fn address(seed_bytes: &[u8], index: u64) -> Result<String, JsError> {
    Ok(qcore::account_address(&*seed(seed_bytes)?, index))
}

#[wasm_bindgen]
pub fn valid_address(address: &str) -> bool {
    qcore::valid_address(address)
}

#[wasm_bindgen(js_name = sameAddress)]
pub fn same_address(a: &str, b: &str) -> bool {
    qcore::same_address(a, b)
}

#[wasm_bindgen(js_name = lookalikeOf)]
pub fn lookalike_of(candidate: &str, known: Vec<String>) -> Option<String> {
    qcore::lookalike_of(candidate, &known)
}

#[wasm_bindgen(js_name = vmDeployAddress)]
pub fn vm_deploy_address() -> String {
    qcore::vm_deploy_address()
}

#[wasm_bindgen(js_name = contractAddress)]
pub fn contract_address(deployer: &str, nonce: u64) -> Option<String> {
    qcore::contract_address(deployer, nonce)
}

#[wasm_bindgen(js_name = mnemonicFromSeed)]
pub fn mnemonic_from_seed(seed_bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    let phrase = qcore::mnemonic_bytes_from_seed(&*seed(seed_bytes)?);
    Ok(phrase.to_vec())
}

#[wasm_bindgen(js_name = mnemonicFromSeedText)]
pub fn mnemonic_from_seed_text(seed_bytes: &[u8]) -> Result<JsValue, JsError> {
    let phrase = qcore::mnemonic_from_seed(&*seed(seed_bytes)?);
    Ok(JsValue::from_str(&phrase))
}

#[inline(never)]
fn restore_seed(mut phrase: String) -> Result<Vec<u8>, JsError> {
    let derived = qcore::seed_from_mnemonic(&phrase);
    phrase.zeroize();
    let seed = derived.map_err(|e| JsError::new(&e))?;
    Ok(seed[..].to_vec())
}

#[inline(never)]
fn scrub_stack() {
    let mut scratch = [0u8; 16384];
    scratch.zeroize();
    std::hint::black_box(&scratch);
}

#[wasm_bindgen(js_name = seedFromMnemonic)]
pub fn seed_from_mnemonic(phrase: String) -> Result<Vec<u8>, JsError> {
    let seed = restore_seed(phrase);
    scrub_stack();
    seed
}

#[inline(never)]
fn restore_seed_bytes(phrase: &[u8]) -> Result<Vec<u8>, JsError> {
    let seed = qcore::seed_from_mnemonic_bytes(phrase).map_err(|e| JsError::new(&e))?;
    Ok(seed[..].to_vec())
}

#[wasm_bindgen(js_name = seedFromMnemonicBytes)]
pub fn seed_from_mnemonic_bytes(phrase: &[u8]) -> Result<Vec<u8>, JsError> {
    let seed = restore_seed_bytes(phrase);
    scrub_stack();
    seed
}

#[wasm_bindgen(js_name = genesisSecs)]
pub fn genesis_secs(chain_name: &str) -> u64 {
    qcore::genesis_secs(chain_name)
}

#[wasm_bindgen(js_name = headCeiling)]
pub fn head_ceiling(chain_name: &str, wall_secs: u64) -> u64 {
    qcore::head_ceiling(chain_name, wall_secs)
}

#[wasm_bindgen(js_name = boundedValidUntil)]
pub fn bounded_valid_until(
    chain_name: &str,
    head: u64,
    wall_secs: u64,
    floor: Option<u64>,
    floor_age_secs: u64,
) -> Result<u64, JsError> {
    qcore::bounded_valid_until(chain_name, head, wall_secs, floor, floor_age_secs)
        .map_err(|e| JsError::new(&e))
}

#[wasm_bindgen(js_name = checkGatewayJson)]
pub fn check_gateway_json(response: &str) -> Result<(), JsError> {
    qcore::check_gateway_json(response).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen(js_name = testnetRpcUrl)]
pub fn testnet_rpc_url() -> String {
    qcore::TESTNET_RPC_URL.to_string()
}

#[wasm_bindgen(js_name = testnetChainName)]
pub fn testnet_chain_name() -> String {
    qcore::TESTNET_CHAIN_NAME.to_string()
}

#[wasm_bindgen(js_name = validityBlocks)]
pub fn validity_blocks() -> u64 {
    qcore::DEFAULT_VALIDITY_BLOCKS
}

#[wasm_bindgen(js_name = SigningSession)]
pub struct SigningSession(qcore::SigningSession);

#[wasm_bindgen(js_class = SigningSession)]
impl SigningSession {
    #[wasm_bindgen(constructor)]
    pub fn new(book: Vec<String>) -> Result<SigningSession, JsError> {
        qcore::SigningSession::with_address_book(&book)
            .map(SigningSession)
            .map_err(|e| JsError::new(&e))
    }

    #[wasm_bindgen(js_name = rememberAddress)]
    pub fn remember_address(&mut self, address: &str) {
        self.0.remember_address(address)
    }

    #[wasm_bindgen(js_name = checkTarget)]
    pub fn check_target(&self, address: &str) -> Result<(), JsError> {
        self.0.check_target(address).map_err(|e| JsError::new(&e))
    }

    pub fn slot(
        &mut self,
        key: &str,
        reported: u64,
        expected: Option<u64>,
        order: bool,
    ) -> Result<u64, JsError> {
        self.0
            .slot(key, reported, expected, order)
            .map_err(|e| JsError::new(&e))
    }

    pub fn signed(&mut self, key: &str, slot: u64) {
        self.0.signed(key, slot)
    }

    pub fn outcome(&mut self, key: &str, slot: u64, accepted: bool) {
        self.0.outcome(key, slot, accepted)
    }

    #[wasm_bindgen(js_name = nextNonce)]
    pub fn next_nonce(&self, key: &str) -> Option<u64> {
        self.0.next_nonce(key)
    }

    #[wasm_bindgen(js_name = isHeld)]
    pub fn is_held(&self, key: &str, slot: u64) -> bool {
        self.0.is_held(key, slot)
    }
}

#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn sign_transfer(
    seed_bytes: &[u8],
    index: u64,
    to: &str,
    amount: &str,
    nonce: u64,
    fee: &str,
    chain_id: u64,
    valid_until: u64,
) -> Result<String, JsError> {
    let master = seed(seed_bytes)?;
    if !qcore::valid_address(to) {
        return Err(JsError::new("the recipient is not a q1 address"));
    }
    let amount = whole_u64(amount, "amount")?;
    let fee = whole(fee, "fee")?;
    let signed = qcore::sign_transfer(
        &master,
        index,
        to,
        amount,
        nonce,
        fee,
        chain_id,
        valid_until,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(signed_json(signed))
}

#[wasm_bindgen(js_name = signRegister)]
pub fn sign_register(
    seed_bytes: &[u8],
    index: u64,
    nonce: u64,
    fee: &str,
    chain_id: u64,
    valid_until: u64,
) -> Result<String, JsError> {
    let master = seed(seed_bytes)?;
    let fee = whole(fee, "fee")?;
    let signed = qcore::sign_register(&master, index, nonce, fee, chain_id, valid_until)
        .map_err(|e| JsError::new(&e))?;
    Ok(signed_json(signed))
}

#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn sign_call(
    seed_bytes: &[u8],
    index: u64,
    target: &str,
    args_hex: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
    chain_id: u64,
    valid_until: u64,
    transfer_fee: Option<String>,
) -> Result<String, JsError> {
    let master = seed(seed_bytes)?;
    if !qcore::valid_address(target) {
        return Err(JsError::new("the target is not a q1 address"));
    }
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee = whole(fee, "fee")?;
    let signed = qcore::sign_call(
        &master,
        index,
        target,
        args,
        nonce,
        meter_limit,
        fee,
        chain_id,
        valid_until,
        self::transfer_fee(transfer_fee)?,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(signed_json(signed))
}

fn addr32(hex: &str) -> Result<[u8; 32], JsError> {
    let bytes = qcore::json::from_hex(hex).map_err(|e| JsError::new(&e))?;
    bytes
        .try_into()
        .map_err(|_| JsError::new("expected 32 bytes of hex"))
}

fn u64_list(csv: &str) -> Result<Vec<u64>, JsError> {
    if csv.trim().is_empty() {
        return Ok(Vec::new());
    }
    csv.split(',')
        .map(|part| {
            qcore::canonical_decimal(part.trim())
                .and_then(|n| u64::try_from(n).ok())
                .ok_or_else(|| JsError::new("a list entry is not a canonical whole number"))
        })
        .collect()
}

#[wasm_bindgen(js_name = orderSigner)]
pub fn order_signer(seed_bytes: &[u8], index: u64) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::order_signer(
        &*seed(seed_bytes)?,
        index,
    )))
}

#[wasm_bindgen(js_name = vmCallFee)]
pub fn vm_call_fee(transfer_fee: &str, meter_limit: u64) -> Result<String, JsError> {
    Ok(qcore::vm_call_fee(whole(transfer_fee, "transfer fee")?, meter_limit).to_string())
}

#[wasm_bindgen(js_name = checkValidUntil)]
pub fn check_valid_until(valid_until: u64, head: u64) -> Result<(), JsError> {
    qcore::check_valid_until(valid_until, head).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen(js_name = nonceSlotKey)]
pub fn nonce_slot_key(signer_hex: &str) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::nonce_slot_key(
        &addr32(signer_hex)?,
    )))
}

#[wasm_bindgen(js_name = scalarSlotKey)]
pub fn scalar_slot_key(slot: u64) -> String {
    qcore::json::to_hex(&qcore::contract::scalar_slot_key(slot))
}

#[wasm_bindgen(js_name = tokenDecimalsSlot)]
pub fn token_decimals_slot() -> u64 {
    qcore::contract::TOKEN_DECIMALS_SLOT
}

#[wasm_bindgen(js_name = tokenSymbolSlot)]
pub fn token_symbol_slot() -> u64 {
    qcore::contract::TOKEN_SYMBOL_SLOT
}

#[wasm_bindgen(js_name = packSymbol)]
pub fn pack_symbol(symbol: &str) -> u64 {
    qcore::contract::pack_symbol(symbol)
}

#[wasm_bindgen(js_name = unpackSymbol)]
pub fn unpack_symbol(word: u64) -> String {
    qcore::contract::unpack_symbol(word)
}

#[wasm_bindgen(js_name = assetBalanceBody)]
pub fn asset_balance_body(issuer: &str, holder: &str) -> String {
    qcore::contract::asset_balance_body(issuer, holder)
}

#[wasm_bindgen(js_name = assetSupplyBody)]
pub fn asset_supply_body(issuer: &str) -> String {
    qcore::contract::asset_supply_body(issuer)
}

#[wasm_bindgen(js_name = mapSlotKey)]
pub fn map_slot_key(map_domain_tag: u64, key_address_hex: &str) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::map_slot_key(
        map_domain_tag,
        &addr32(key_address_hex)?,
    )))
}

#[wasm_bindgen(js_name = mapAddrWordKey)]
pub fn map_addr_word_key(
    map_domain_tag: u64,
    key32_hex: &str,
    word: u64,
) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::map_addr_word_key(
        map_domain_tag,
        &addr32(key32_hex)?,
        word,
    )))
}

#[wasm_bindgen(js_name = nameKey)]
pub fn name_key(label: &str) -> String {
    qcore::json::to_hex(&qcore::contract::name_key(label))
}

#[wasm_bindgen(js_name = buildSignedOrderCall)]
#[allow(clippy::too_many_arguments)]
pub fn build_signed_order_call(
    chain_id: u64,
    contract: &str,
    selector_hex: &str,
    layout_hash_hex: &str,
    scheme_off: u64,
    ptr_off: u64,
    expiry_off: u64,
    field_offs_csv: &str,
    fields_csv: &str,
    region_off: u64,
    owner_seed_bytes: &[u8],
    owner_index: u64,
    nonce: u64,
    expiry: u64,
) -> Result<String, JsError> {
    let owner = seed(owner_seed_bytes)?;
    let selector: [u8; 4] = qcore::json::from_hex(selector_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the selector is 4 bytes of hex"))?;
    let layout_hash =
        qcore::contract::layout_hash_from_hex(layout_hash_hex).map_err(|e| JsError::new(&e))?;
    let mut layout = qcore::contract::OrderLayout::new(
        scheme_off,
        ptr_off,
        expiry_off,
        u64_list(field_offs_csv)?,
        expiry,
        layout_hash,
    );
    if region_off != 0 {
        layout.region_off = region_off;
    }
    let fields = u64_list(fields_csv)?;
    let order = qcore::contract::build_signed_order_call(
        chain_id,
        contract,
        selector,
        &layout,
        &fields,
        &owner,
        owner_index,
        nonce,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        (
            "call_args",
            qcore::json::Json::str(qcore::json::to_hex(&order.call_args)),
        ),
        (
            "message",
            qcore::json::Json::str(qcore::json::to_hex(&order.message)),
        ),
        (
            "signature",
            qcore::json::Json::str(qcore::json::to_hex(&order.signature)),
        ),
        (
            "public_key",
            qcore::json::Json::str(qcore::json::to_hex(&order.public_key)),
        ),
        (
            "signer",
            qcore::json::Json::str(qcore::json::to_hex(&order.signer)),
        ),
        ("nonce", qcore::json::Json::Int(order.nonce)),
        ("expiry", qcore::json::Json::Int(order.expiry)),
    ])
    .render())
}

#[wasm_bindgen(js_name = buildTypedOrderCall)]
#[allow(clippy::too_many_arguments)]
pub fn build_typed_order_call(
    chain_id: u64,
    contract: &str,
    selector_hex: &str,
    layout_hash_hex: &str,
    scheme_off: u64,
    ptr_off: u64,
    expiry_off: u64,
    region_off: u64,
    fields_json: &str,
    owner_seed_bytes: &[u8],
    owner_index: u64,
    nonce: u64,
    expiry: u64,
) -> Result<String, JsError> {
    let owner = seed(owner_seed_bytes)?;
    let selector: [u8; 4] = qcore::json::from_hex(selector_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the selector is 4 bytes of hex"))?;
    let layout_hash =
        qcore::contract::layout_hash_from_hex(layout_hash_hex).map_err(|e| JsError::new(&e))?;
    let fields = parse_typed_fields(fields_json)?;
    let order = qcore::contract::build_order_from_typed(
        chain_id,
        contract,
        selector,
        &layout_hash,
        scheme_off,
        ptr_off,
        expiry_off,
        region_off,
        &fields,
        &owner,
        owner_index,
        nonce,
        expiry,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        (
            "call_args",
            qcore::json::Json::str(qcore::json::to_hex(&order.call_args)),
        ),
        (
            "message",
            qcore::json::Json::str(qcore::json::to_hex(&order.message)),
        ),
        (
            "signature",
            qcore::json::Json::str(qcore::json::to_hex(&order.signature)),
        ),
        (
            "public_key",
            qcore::json::Json::str(qcore::json::to_hex(&order.public_key)),
        ),
        (
            "signer",
            qcore::json::Json::str(qcore::json::to_hex(&order.signer)),
        ),
        ("nonce", qcore::json::Json::Int(order.nonce)),
        ("expiry", qcore::json::Json::Int(order.expiry)),
    ])
    .render())
}

#[wasm_bindgen(js_name = checkOrderExpiry)]
pub fn check_order_expiry(expiry: u64, now_secs: u64) -> Result<(), JsError> {
    qcore::contract::check_order_expiry(expiry, now_secs).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen(js_name = orderLayoutHash)]
pub fn order_layout_hash(selector_hex: &str, fields_json: &str) -> Result<String, JsError> {
    let selector: [u8; 4] = qcore::json::from_hex(selector_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the selector is 4 bytes of hex"))?;
    let parsed = qcore::json::parse(fields_json).map_err(|e| JsError::new(&e))?;
    let items = match &parsed {
        qcore::json::Json::Array(items) => items,
        _ => return Err(JsError::new("the order layout must be a JSON array")),
    };
    let mut fields = Vec::with_capacity(items.len());
    for item in items {
        let name = item
            .get("name")
            .and_then(|v| v.as_str())
            .ok_or_else(|| JsError::new("an order layout field needs a string name"))?;
        let ty = item
            .get("type")
            .and_then(|v| v.as_str())
            .ok_or_else(|| JsError::new("an order layout field needs a string type"))?;
        let width = item
            .get("width")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| JsError::new("an order layout field needs a numeric width"))?;
        fields.push(qcore::contract::OrderLayoutField {
            name: name.to_string(),
            ty: ty.to_string(),
            width,
        });
    }
    Ok(qcore::json::to_hex(&qcore::contract::order_layout_hash(
        selector, &fields,
    )))
}

fn parse_typed_fields(fields_json: &str) -> Result<Vec<qcore::contract::TypedField>, JsError> {
    let parsed = qcore::json::parse(fields_json).map_err(|e| JsError::new(&e))?;
    let items = match &parsed {
        qcore::json::Json::Array(items) => items,
        _ => return Err(JsError::new("the signed order fields must be a JSON array")),
    };
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        let offset = item
            .get("offset")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| JsError::new("a signed order field needs a numeric offset"))?;
        let width = item
            .get("width")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| JsError::new("a signed order field needs a numeric width"))?;
        let value = item
            .get("value")
            .and_then(|v| v.as_str())
            .ok_or_else(|| JsError::new("a signed order field needs a string value"))?
            .to_string();
        out.push(qcore::contract::TypedField {
            offset,
            width,
            value,
        });
    }
    Ok(out)
}

#[wasm_bindgen(js_name = storageBody)]
pub fn storage_body(contract: &str) -> String {
    qcore::contract::storage_body(contract)
}

#[wasm_bindgen(js_name = eventsBody)]
pub fn events_body(height: u64) -> String {
    qcore::contract::events_body(height)
}

#[wasm_bindgen(js_name = storageValue)]
pub fn storage_value(response: &str, slot_key_hex: &str) -> Result<String, JsError> {
    let slots = qcore::contract::parse_storage(response).map_err(|e| JsError::new(&e))?;
    let key = addr32(slot_key_hex)?;
    Ok(qcore::contract::storage_value(&slots, &key).to_string())
}

#[wasm_bindgen(js_name = storageValueReported)]
pub fn storage_value_reported(
    response: &str,
    slot_key_hex: &str,
) -> Result<Option<String>, JsError> {
    let slots = qcore::contract::parse_storage(response).map_err(|e| JsError::new(&e))?;
    let key = addr32(slot_key_hex)?;
    Ok(qcore::contract::storage_value_reported(&slots, &key).map(|v| v.to_string()))
}

#[wasm_bindgen(js_name = parseEvents)]
pub fn parse_events(response: &str) -> Result<String, JsError> {
    let events = qcore::contract::parse_events(response).map_err(|e| JsError::new(&e))?;
    let items: Vec<qcore::json::Json> = events
        .iter()
        .map(|event| {
            let mut fields = vec![
                ("contract", qcore::json::Json::str(event.contract.clone())),
                (
                    "selector",
                    qcore::json::Json::str(qcore::json::to_hex(&event.selector)),
                ),
                (
                    "data",
                    qcore::json::Json::str(qcore::json::to_hex(&event.data)),
                ),
            ];
            if let Some(word) = qcore::contract::event_word(&event.data) {
                fields.push(("value", qcore::json::Json::str(word.to_string())));
            }
            qcore::json::object(fields)
        })
        .collect();
    Ok(qcore::json::Json::Array(items).render())
}

#[wasm_bindgen]
pub fn submit_body(tx_hex: &str) -> Result<String, JsError> {
    let bytes = qcore::json::from_hex(tx_hex).map_err(|e| JsError::new(&e))?;
    Ok(qcore::submit_body(&bytes))
}

#[wasm_bindgen]
pub fn account_body(address: &str) -> String {
    qcore::account_body(address)
}

#[wasm_bindgen]
pub fn transaction_body(tx_id: &str) -> String {
    qcore::transaction_body(tx_id)
}

#[wasm_bindgen]
pub fn block_by_height_body(height: u64) -> String {
    qcore::block_by_height_body(height)
}

#[wasm_bindgen(js_name = chainIdFromName)]
pub fn chain_id_from_name(name: &str) -> Result<u64, JsError> {
    qcore::checked_chain_id(name).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen(js_name = localChainId)]
pub fn local_chain_id() -> u64 {
    qcore::LOCAL_CHAIN_ID
}

#[wasm_bindgen(js_name = mainnetChainId)]
pub fn mainnet_chain_id() -> u64 {
    qcore::MAINNET_CHAIN_ID
}

#[wasm_bindgen(js_name = testnetChainId)]
pub fn testnet_chain_id() -> u64 {
    qcore::testnet_chain_id()
}

#[wasm_bindgen(js_name = signPayableCall)]
#[allow(clippy::too_many_arguments)]
pub fn sign_payable_call(
    seed_bytes: &[u8],
    index: u64,
    target: &str,
    args_hex: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
    value: &str,
    chain_id: u64,
    valid_until: u64,
    transfer_fee: Option<String>,
) -> Result<String, JsError> {
    let master = seed(seed_bytes)?;
    if !qcore::valid_address(target) {
        return Err(JsError::new("the target is not a q1 address"));
    }
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee = whole(fee, "fee")?;
    let value = whole_u64(value, "value")?;

    let signed = qcore::sign_payable_call(
        &master,
        index,
        target,
        args,
        value,
        nonce,
        meter_limit,
        fee,
        chain_id,
        valid_until,
        self::transfer_fee(transfer_fee)?,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(signed_json(signed))
}

#[wasm_bindgen(js_name = signAssetCall)]
#[allow(clippy::too_many_arguments)]
pub fn sign_asset_call(
    seed_bytes: &[u8],
    index: u64,
    target: &str,
    args_hex: &str,
    asset_issuer: &str,
    amount: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
    chain_id: u64,
    valid_until: u64,
    transfer_fee: Option<String>,
) -> Result<String, JsError> {
    let master = seed(seed_bytes)?;
    if !qcore::valid_address(target) {
        return Err(JsError::new("the target is not a q1 address"));
    }
    if !qcore::valid_address(asset_issuer) {
        return Err(JsError::new("the asset issuer is not a q1 address"));
    }
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee = whole(fee, "fee")?;
    let amount = whole_u64(amount, "amount")?;
    let signed = qcore::sign_asset_call(
        &master,
        index,
        target,
        args,
        asset_issuer,
        amount,
        nonce,
        meter_limit,
        fee,
        chain_id,
        valid_until,
        self::transfer_fee(transfer_fee)?,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(signed_json(signed))
}

#[cfg(test)]
mod payable_tests {
    use super::*;

    fn seed_bytes() -> [u8; 32] {
        let mut s = [0u8; 32];
        for (i, b) in s.iter_mut().enumerate() {
            *b = i as u8;
        }
        s
    }

    #[test]
    fn the_seed_helper_decodes_into_a_zeroizing_handle() {
        let handle = seed(&seed_bytes()).unwrap();
        let mut expected = [0u8; 32];
        for (i, slot) in expected.iter_mut().enumerate() {
            *slot = i as u8;
        }
        assert_eq!(
            *handle, expected,
            "the seed decodes to the canonical bytes through the zeroizing scratch"
        );
        assert_eq!(
            address(&seed_bytes(), 0).unwrap(),
            qcore::account_address(&expected, 0),
            "an address over the zeroizing handle matches one over the raw seed"
        );
    }

    #[test]
    fn signing_is_deterministic() {
        let target = address(&seed_bytes(), 8).unwrap();
        let first = sign_payable_call(
            &seed_bytes(),
            7,
            &target,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        let second = sign_payable_call(
            &seed_bytes(),
            7,
            &target,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        assert_eq!(first, second);
    }

    #[test]
    fn the_signature_binds_the_raw_address_payload_not_the_rendered_string() {
        let target = address(&seed_bytes(), 8).unwrap();
        let lower = target.to_ascii_lowercase();
        let upper = target.to_ascii_uppercase();
        assert_ne!(lower, upper, "the two variants must differ only in case");
        let signed_lower = sign_payable_call(
            &seed_bytes(),
            7,
            &lower,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        let signed_upper = sign_payable_call(
            &seed_bytes(),
            7,
            &upper,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        assert_eq!(signed_lower, signed_upper);
    }

    #[test]
    fn the_value_is_bound_into_the_signature() {
        let target = address(&seed_bytes(), 8).unwrap();
        let a = sign_payable_call(
            &seed_bytes(),
            7,
            &target,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        let b = sign_payable_call(
            &seed_bytes(),
            7,
            &target,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250001",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn the_chain_id_is_bound_into_the_signature() {
        let target = address(&seed_bytes(), 8).unwrap();
        let a = sign_payable_call(
            &seed_bytes(),
            7,
            &target,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::TESTNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        let b = sign_payable_call(
            &seed_bytes(),
            7,
            &target,
            "deadbeef",
            3,
            21_000,
            "1000000",
            "250000",
            qtv_tx::MAINNET_CHAIN_ID,
            300,
            Some("500".to_string()),
        )
        .unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn a_call_fee_follows_the_meter_and_a_deadline_is_capped_past_the_head() {
        assert_eq!(vm_call_fee("500", 21_000).unwrap(), "9000");
        assert_eq!(vm_call_fee("500", 1).unwrap(), "500");
        assert!(check_valid_until(1_300, 1_000).is_ok());
        assert!(check_valid_until(1_000 + 3_600, 1_000).is_ok());
    }

    #[test]
    fn the_testnet_chain_id_follows_the_testnet_network() {
        assert_eq!(
            testnet_chain_id(),
            qcore::chain_id_from_name(&qcore::Network::testnet().chain_id.unwrap())
        );
        assert_eq!(
            Some(testnet_rpc_url()),
            qcore::Network::testnet().rpc_url,
            "the javascript client reads the testnet endpoint from the core"
        );
        assert_eq!(
            genesis_secs(&testnet_chain_name()),
            qcore::TESTNET_GENESIS_SECS
        );
    }
}

fn parse_roster(roster_json: &str) -> Result<Vec<qcore::finality::RosterMember>, String> {
    let parsed = qcore::json::parse(roster_json)?;
    let items = match &parsed {
        qcore::json::Json::Array(items) => items,
        _ => return Err("the validator roster must be a JSON array".to_string()),
    };
    let mut roster = Vec::with_capacity(items.len());
    for item in items {
        let id = item
            .get("id")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| "a roster member needs a numeric id".to_string())?;
        let stake = item
            .get("stake")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "a roster member needs a stake as a digit string".to_string())?;
        let stake: u64 = qcore::canonical_decimal(stake)
            .ok_or_else(|| "a roster stake is not a canonical whole number".to_string())?
            .try_into()
            .map_err(|_| "a roster stake is out of range".to_string())?;
        let pk = item
            .get("attest_pk")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "a roster member needs an attest_pk".to_string())?;
        roster.push(qcore::finality::RosterMember {
            id,
            stake,
            attest_pk: qcore::json::from_hex(pk)?,
        });
    }
    Ok(roster)
}

fn parse_steps(steps_json: &str) -> Result<Vec<([u8; 32], bool)>, String> {
    let parsed = qcore::json::parse(steps_json)?;
    let items = match &parsed {
        qcore::json::Json::Array(items) => items,
        _ => return Err("the proof steps must be a JSON array".to_string()),
    };
    let mut steps = Vec::with_capacity(items.len());
    for item in items {
        let sibling = item
            .get("sibling")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "a proof step needs a sibling".to_string())?;
        let left = match item.get("left") {
            Some(qcore::json::Json::Bool(b)) => *b,
            _ => return Err("a proof step needs a boolean left".to_string()),
        };
        let bytes: [u8; 32] = qcore::json::from_hex(sibling)?
            .try_into()
            .map_err(|_| "a proof sibling is 32 bytes of hex".to_string())?;
        steps.push((bytes, left));
    }
    Ok(steps)
}

fn finalized_json(h: &qcore::finality::FinalizedHeader) -> String {
    qcore::json::object(vec![
        ("height", qcore::json::Json::str(h.height.to_string())),
        ("hash", qcore::json::Json::str(qcore::json::to_hex(&h.hash))),
        (
            "parent_hash",
            qcore::json::Json::str(qcore::json::to_hex(&h.parent_hash)),
        ),
        (
            "q_root",
            qcore::json::Json::str(qcore::json::to_hex(&h.q_root)),
        ),
        (
            "transaction_root",
            qcore::json::Json::str(qcore::json::to_hex(&h.transaction_root)),
        ),
        (
            "event_root",
            qcore::json::Json::str(qcore::json::to_hex(&h.event_root)),
        ),
        ("time", qcore::json::Json::str(h.time.to_string())),
        (
            "signed_stake",
            qcore::json::Json::str(h.signed_stake.to_string()),
        ),
        (
            "total_stake",
            qcore::json::Json::str(h.total_stake.to_string()),
        ),
    ])
    .render()
}

#[wasm_bindgen(js_name = verifyFinality)]
pub fn verify_finality(
    chain_id: u64,
    header_hex: &str,
    certificate_hex: &str,
    roster_json: &str,
) -> Result<String, JsError> {
    let header = qcore::json::from_hex(header_hex).map_err(|e| JsError::new(&e))?;
    let certificate = qcore::json::from_hex(certificate_hex).map_err(|e| JsError::new(&e))?;
    let roster = parse_roster(roster_json).map_err(|e| JsError::new(&e))?;
    let verified = qcore::finality::verify_finality(chain_id, &header, &certificate, &roster)
        .map_err(|e| JsError::new(&e))?;
    Ok(finalized_json(&verified))
}

#[wasm_bindgen(js_name = verifyEvent)]
pub fn verify_event(
    event_root_hex: &str,
    leaf_hex: &str,
    steps_json: &str,
) -> Result<bool, JsError> {
    let root: [u8; 32] = qcore::json::from_hex(event_root_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the event root is 32 bytes of hex"))?;
    let leaf = qcore::json::from_hex(leaf_hex).map_err(|e| JsError::new(&e))?;
    let steps = parse_steps(steps_json).map_err(|e| JsError::new(&e))?;
    Ok(qcore::finality::verify_event(&root, &leaf, &steps))
}

#[wasm_bindgen(js_name = decodeEvent)]
pub fn decode_event(leaf_hex: &str) -> Result<String, JsError> {
    let leaf = qcore::json::from_hex(leaf_hex).map_err(|e| JsError::new(&e))?;
    let event = qcore::finality::decode_event(&leaf).map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("contract", qcore::json::Json::str(event.contract)),
        (
            "selector",
            qcore::json::Json::str(qcore::json::to_hex(&event.selector)),
        ),
        (
            "data",
            qcore::json::Json::str(qcore::json::to_hex(&event.data)),
        ),
    ])
    .render())
}
