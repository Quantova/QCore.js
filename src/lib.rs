// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

use wasm_bindgen::prelude::*;
use qtv_wipe::{Zeroize, Zeroizing};

fn seed(seed_hex: &str) -> Result<Zeroizing<[u8; 32]>, JsError> {
    let mut bytes = qcore::json::from_hex(seed_hex).map_err(|e| JsError::new(&e))?;
    if bytes.len() != 32 {
        bytes.zeroize();
        return Err(JsError::new("a seed is 32 bytes of hex"));
    }
    let mut seed = Zeroizing::new([0u8; 32]);
    seed.copy_from_slice(&bytes);
    bytes.zeroize();
    Ok(seed)
}

#[wasm_bindgen]
pub fn address(seed_hex: &str, index: u64) -> Result<String, JsError> {
    Ok(qcore::account_address(&*seed(seed_hex)?, index))
}

#[wasm_bindgen]
pub fn valid_address(address: &str) -> bool {
    qcore::valid_address(address)
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
pub fn mnemonic_from_seed(seed_hex: &str) -> Result<String, JsError> {
    Ok(qcore::mnemonic_from_seed(&*seed(seed_hex)?))
}

#[wasm_bindgen(js_name = seedFromMnemonic)]
pub fn seed_from_mnemonic(phrase: &str) -> Result<String, JsError> {
    let seed = qcore::seed_from_mnemonic(phrase).map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::to_hex(&seed[..]))
}

#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn sign_transfer(
    seed_hex: &str,
    index: u64,
    to: &str,
    amount: &str,
    nonce: u64,
    fee: &str,
    chain_id: u64,
) -> Result<String, JsError> {
    if !qcore::valid_address(to) {
        return Err(JsError::new("the recipient is not a q1 address"));
    }
    let amount: u64 = amount
        .parse()
        .map_err(|_| JsError::new("amount is a whole number string"))?;
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let signed = qcore::sign_transfer(&*seed(seed_hex)?, index, to, amount, nonce, fee, chain_id)
        .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
}

#[wasm_bindgen(js_name = signRegister)]
pub fn sign_register(
    seed_hex: &str,
    index: u64,
    nonce: u64,
    fee: &str,
    chain_id: u64,
) -> Result<String, JsError> {
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let signed = qcore::sign_register(&*seed(seed_hex)?, index, nonce, fee, chain_id)
        .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
}

#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn sign_call(
    seed_hex: &str,
    index: u64,
    target: &str,
    args_hex: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
    chain_id: u64,
) -> Result<String, JsError> {
    if !qcore::valid_address(target) {
        return Err(JsError::new("the target is not a q1 address"));
    }
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let signed =
        qcore::sign_call(&*seed(seed_hex)?, index, target, args, nonce, meter_limit, fee, chain_id)
            .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
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
            part.trim()
                .parse::<u64>()
                .map_err(|_| JsError::new("a list entry is not a whole number"))
        })
        .collect()
}

#[wasm_bindgen(js_name = orderSigner)]
pub fn order_signer(seed_hex: &str, index: u64) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::order_signer(&*seed(seed_hex)?, index)))
}

#[wasm_bindgen(js_name = nonceSlotKey)]
pub fn nonce_slot_key(signer_hex: &str) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::nonce_slot_key(&addr32(signer_hex)?)))
}

#[wasm_bindgen(js_name = scalarSlotKey)]
pub fn scalar_slot_key(slot: u64) -> String {
    qcore::json::to_hex(&qcore::contract::scalar_slot_key(slot))
}

#[wasm_bindgen(js_name = mapSlotKey)]
pub fn map_slot_key(map_domain_tag: u64, key_address_hex: &str) -> Result<String, JsError> {
    Ok(qcore::json::to_hex(&qcore::contract::map_slot_key(
        map_domain_tag,
        &addr32(key_address_hex)?,
    )))
}

#[wasm_bindgen(js_name = buildSignedOrderCall)]
#[allow(clippy::too_many_arguments)]
pub fn build_signed_order_call(
    chain_id: u64,
    contract: &str,
    selector_hex: &str,
    scheme_off: u64,
    ptr_off: u64,
    field_offs_csv: &str,
    fields_csv: &str,
    region_off: u64,
    owner_seed_hex: &str,
    owner_index: u64,
    nonce: u64,
) -> Result<String, JsError> {
    let selector: [u8; 4] = qcore::json::from_hex(selector_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the selector is 4 bytes of hex"))?;
    let mut layout = qcore::contract::OrderLayout::new(scheme_off, ptr_off, u64_list(field_offs_csv)?);
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
        &*seed(owner_seed_hex)?,
        owner_index,
        nonce,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("call_args", qcore::json::Json::str(qcore::json::to_hex(&order.call_args))),
        ("message", qcore::json::Json::str(qcore::json::to_hex(&order.message))),
        ("signature", qcore::json::Json::str(qcore::json::to_hex(&order.signature))),
        ("public_key", qcore::json::Json::str(qcore::json::to_hex(&order.public_key))),
        ("signer", qcore::json::Json::str(qcore::json::to_hex(&order.signer))),
        ("nonce", qcore::json::Json::Int(order.nonce)),
    ])
    .render())
}

#[wasm_bindgen(js_name = buildTypedOrderCall)]
#[allow(clippy::too_many_arguments)]
pub fn build_typed_order_call(
    chain_id: u64,
    contract: &str,
    selector_hex: &str,
    scheme_off: u64,
    ptr_off: u64,
    region_off: u64,
    fields_json: &str,
    owner_seed_hex: &str,
    owner_index: u64,
    nonce: u64,
) -> Result<String, JsError> {
    let selector: [u8; 4] = qcore::json::from_hex(selector_hex)
        .map_err(|e| JsError::new(&e))?
        .try_into()
        .map_err(|_| JsError::new("the selector is 4 bytes of hex"))?;
    let fields = parse_typed_fields(fields_json)?;
    let order = qcore::contract::build_order_from_typed(
        chain_id,
        contract,
        selector,
        scheme_off,
        ptr_off,
        region_off,
        &fields,
        &*seed(owner_seed_hex)?,
        owner_index,
        nonce,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("call_args", qcore::json::Json::str(qcore::json::to_hex(&order.call_args))),
        ("message", qcore::json::Json::str(qcore::json::to_hex(&order.message))),
        ("signature", qcore::json::Json::str(qcore::json::to_hex(&order.signature))),
        ("public_key", qcore::json::Json::str(qcore::json::to_hex(&order.public_key))),
        ("signer", qcore::json::Json::str(qcore::json::to_hex(&order.signer))),
        ("nonce", qcore::json::Json::Int(order.nonce)),
    ])
    .render())
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
        out.push(qcore::contract::TypedField { offset, width, value });
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

#[wasm_bindgen(js_name = parseEvents)]
pub fn parse_events(response: &str) -> Result<String, JsError> {
    let events = qcore::contract::parse_events(response).map_err(|e| JsError::new(&e))?;
    let items: Vec<qcore::json::Json> = events
        .iter()
        .map(|event| {
            let mut fields = vec![
                ("contract", qcore::json::Json::str(event.contract.clone())),
                ("selector", qcore::json::Json::str(qcore::json::to_hex(&event.selector))),
                ("data", qcore::json::Json::str(qcore::json::to_hex(&event.data))),
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
pub fn chain_id_from_name(name: &str) -> u64 {
    qtv_tx::chain_id_from_name(name)
}

#[wasm_bindgen(js_name = localChainId)]
pub fn local_chain_id() -> u64 {
    qtv_tx::LOCAL_CHAIN_ID
}

#[wasm_bindgen(js_name = mainnetChainId)]
pub fn mainnet_chain_id() -> u64 {
    qtv_tx::MAINNET_CHAIN_ID
}

#[wasm_bindgen(js_name = testnetChainId)]
pub fn testnet_chain_id() -> u64 {
    qtv_tx::TESTNET_CHAIN_ID
}

#[wasm_bindgen(js_name = signPayableCall)]
#[allow(clippy::too_many_arguments)]
pub fn sign_payable_call(
    seed_hex: &str,
    index: u64,
    target: &str,
    args_hex: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
    value: &str,
    chain_id: u64,
) -> Result<String, JsError> {
    if !qcore::valid_address(target) {
        return Err(JsError::new("the target is not a q1 address"));
    }
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let value: u64 = value
        .parse()
        .map_err(|_| JsError::new("value is a whole number string"))?;

    // The body and the signature come from the one canonical signer in qtv-tx, the same path
    // QCore.rs and QCore.py sign through, so the wire is never hand assembled a second time here.
    let sender = qtv_account::derive(&*seed(seed_hex)?, index);
    let call = qtv_tx::Call::new(target.to_string(), args);
    let body = qtv_tx::Body::with_context(
        sender.address(),
        nonce,
        meter_limit,
        fee,
        call,
        value,
        chain_id,
    );
    let wrapper = qtv_tx::sign(&sender, &body);
    let tx_bytes = qtv_codec::to_bytes(&wrapper);

    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(sender.address())),
        ("tx_id", qcore::json::Json::str(wrapper.id())),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&tx_bytes)),
        ),
    ])
    .render())
}

#[wasm_bindgen(js_name = signAssetCall)]
#[allow(clippy::too_many_arguments)]
pub fn sign_asset_call(
    seed_hex: &str,
    index: u64,
    target: &str,
    args_hex: &str,
    asset_issuer: &str,
    amount: &str,
    nonce: u64,
    meter_limit: u64,
    fee: &str,
    chain_id: u64,
) -> Result<String, JsError> {
    let args = qcore::json::from_hex(args_hex).map_err(|e| JsError::new(&e))?;
    let fee: u128 = fee
        .parse()
        .map_err(|_| JsError::new("fee is a whole number string"))?;
    let amount: u64 = amount
        .parse()
        .map_err(|_| JsError::new("amount is a whole number string"))?;
    let signed = qcore::sign_asset_call(
        &*seed(seed_hex)?,
        index,
        target,
        args,
        asset_issuer,
        amount,
        nonce,
        meter_limit,
        fee,
        chain_id,
    )
    .map_err(|e| JsError::new(&e))?;
    Ok(qcore::json::object(vec![
        ("from", qcore::json::Json::str(signed.from)),
        ("tx_id", qcore::json::Json::str(signed.tx_id)),
        (
            "tx_hex",
            qcore::json::Json::str(qcore::json::to_hex(&signed.tx_bytes)),
        ),
    ])
    .render())
}

#[cfg(test)]
mod payable_tests {
    use super::*;

    fn seed_hex() -> String {
        "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f".to_string()
    }

    #[test]
    fn the_seed_helper_decodes_into_a_zeroizing_handle() {
        let handle = seed(&seed_hex()).unwrap();
        let mut expected = [0u8; 32];
        for (i, slot) in expected.iter_mut().enumerate() {
            *slot = i as u8;
        }
        assert_eq!(*handle, expected, "the seed decodes to the canonical bytes through the zeroizing scratch");
        assert_eq!(
            address(&seed_hex(), 0).unwrap(),
            qcore::account_address(&expected, 0),
            "an address over the zeroizing handle matches one over the raw seed"
        );
    }

    #[test]
    fn signing_is_deterministic() {
        let target = address(&seed_hex(), 8).unwrap();
        let first =
            sign_payable_call(&seed_hex(), 7, &target, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        let second =
            sign_payable_call(&seed_hex(), 7, &target, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        assert_eq!(first, second);
    }

    #[test]
    fn the_signature_binds_the_raw_address_payload_not_the_rendered_string() {
        let target = address(&seed_hex(), 8).unwrap();
        let lower = target.to_ascii_lowercase();
        let upper = target.to_ascii_uppercase();
        assert_ne!(lower, upper, "the two variants must differ only in case");
        let signed_lower =
            sign_payable_call(&seed_hex(), 7, &lower, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        let signed_upper =
            sign_payable_call(&seed_hex(), 7, &upper, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        assert_eq!(signed_lower, signed_upper);
    }

    #[test]
    fn the_value_is_bound_into_the_signature() {
        let target = address(&seed_hex(), 8).unwrap();
        let a = sign_payable_call(&seed_hex(), 7, &target, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        let b = sign_payable_call(&seed_hex(), 7, &target, "deadbeef", 3, 21_000, "1000000", "250001", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        assert_ne!(a, b);
    }

    #[test]
    fn the_chain_id_is_bound_into_the_signature() {
        let target = address(&seed_hex(), 8).unwrap();
        let a = sign_payable_call(&seed_hex(), 7, &target, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::TESTNET_CHAIN_ID).unwrap();
        let b = sign_payable_call(&seed_hex(), 7, &target, "deadbeef", 3, 21_000, "1000000", "250000", qtv_tx::MAINNET_CHAIN_ID).unwrap();
        assert_ne!(a, b);
    }
}
