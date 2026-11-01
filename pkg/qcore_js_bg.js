export class SigningSession {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SigningSessionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_signingsession_free(ptr, 0);
    }
    /**
     * @param {string} address
     */
    checkTarget(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_checkTarget(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {string}
     */
    exportState() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.signingsession_exportState(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} chain
     * @returns {BigUint64Array | undefined}
     */
    headFloor(chain) {
        const ptr0 = passStringToWasm0(chain, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_headFloor(this.__wbg_ptr, ptr0, len0);
        let v2;
        if (ret[0] !== 0) {
            v2 = getArrayU64FromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        }
        return v2;
    }
    /**
     * @param {string} state
     */
    importState(state) {
        const ptr0 = passStringToWasm0(state, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_importState(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} key
     * @param {bigint} slot
     * @returns {boolean}
     */
    isHeld(key, slot) {
        const val2 = BigInt.asIntN(64, slot);
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_isHeld(this.__wbg_ptr, ptr0, len0, val2);
        return ret !== 0;
    }
    /**
     * @param {string[]} book
     */
    constructor(book) {
        const ptr0 = passArrayJsValueToWasm0(book, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        SigningSessionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} key
     * @returns {bigint | undefined}
     */
    nextNonce(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_nextNonce(this.__wbg_ptr, ptr0, len0);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
    /**
     * @param {string} chain
     * @param {bigint} height
     * @param {bigint} wall_secs
     */
    noteHead(chain, height, wall_secs) {
        const val2 = BigInt.asIntN(64, height);
        const val3 = BigInt.asIntN(64, wall_secs);
        const ptr0 = passStringToWasm0(chain, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.signingsession_noteHead(this.__wbg_ptr, ptr0, len0, val2, val3);
    }
    /**
     * @param {string} key
     * @param {bigint} slot
     * @param {boolean} accepted
     */
    outcome(key, slot, accepted) {
        const val2 = BigInt.asIntN(64, slot);
        const val3 = +accepted;
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.signingsession_outcome(this.__wbg_ptr, ptr0, len0, val2, val3);
    }
    /**
     * @param {string} key
     */
    releasePending(key) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.signingsession_releasePending(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} key
     * @param {bigint} slot
     */
    release(key, slot) {
        const val2 = BigInt.asIntN(64, slot);
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.signingsession_release(this.__wbg_ptr, ptr0, len0, val2);
    }
    /**
     * @param {string} address
     */
    rememberAddress(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.signingsession_rememberAddress(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} key
     * @param {bigint} slot
     */
    signed(key, slot) {
        const val2 = BigInt.asIntN(64, slot);
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.signingsession_signed(this.__wbg_ptr, ptr0, len0, val2);
    }
    /**
     * @param {string} key
     * @param {bigint} reported
     * @param {bigint | null | undefined} expected
     * @param {boolean} order
     * @returns {bigint}
     */
    slot(key, reported, expected, order) {
        const val2 = BigInt.asIntN(64, reported);
        const val3 = BigInt.asIntN(64, (isLikeNone(expected) ? BigInt(0) : expected));
        const val4 = +order;
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.signingsession_slot(this.__wbg_ptr, ptr0, len0, val2, !isLikeNone(expected), val3, val4);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return BigInt.asUintN(64, ret[0]);
    }
}
if (Symbol.dispose) SigningSession.prototype[Symbol.dispose] = SigningSession.prototype.free;

/**
 * @param {string} address
 * @returns {string}
 */
export function account_body(address) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.account_body(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @returns {string}
 */
export function address(seed_bytes, index) {
    let deferred4_0;
    let deferred4_1;
    try {
        const val2 = BigInt.asIntN(64, index);
        const ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.address(ptr0, len0, val2);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {string} issuer
 * @param {string} holder
 * @returns {string}
 */
export function assetBalanceBody(issuer, holder) {
    let deferred3_0;
    let deferred3_1;
    try {
        let ptr0, len0, ptr1, len1;
        try {
            ptr0 = passStringToWasm0(issuer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(holder, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.assetBalanceBody(ptr0, len0, ptr1, len1);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {string} issuer
 * @returns {string}
 */
export function assetSupplyBody(issuer) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(issuer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.assetSupplyBody(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {bigint} height
 * @returns {string}
 */
export function block_by_height_body(height) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.block_by_height_body(height);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {string} chain_name
 * @param {bigint} head
 * @param {bigint} wall_secs
 * @param {bigint | null | undefined} floor
 * @param {bigint} floor_age_secs
 * @returns {bigint}
 */
export function boundedValidUntil(chain_name, head, wall_secs, floor, floor_age_secs) {
    const val2 = BigInt.asIntN(64, head);
    const val3 = BigInt.asIntN(64, wall_secs);
    const val4 = BigInt.asIntN(64, (isLikeNone(floor) ? BigInt(0) : floor));
    const val5 = BigInt.asIntN(64, floor_age_secs);
    const ptr0 = passStringToWasm0(chain_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.boundedValidUntil(ptr0, len0, val2, val3, !isLikeNone(floor), val4, val5);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BigInt.asUintN(64, ret[0]);
}

/**
 * @param {bigint | null | undefined} genesis_secs
 * @param {bigint | null | undefined} blocks_per_sec
 * @param {boolean} verified
 * @param {bigint} head
 * @param {bigint} wall_secs
 * @param {bigint | null | undefined} floor
 * @param {bigint} floor_age_secs
 * @returns {bigint}
 */
export function boundedValidUntilFor(genesis_secs, blocks_per_sec, verified, head, wall_secs, floor, floor_age_secs) {
    const ret = wasm.boundedValidUntilFor(!isLikeNone(genesis_secs), isLikeNone(genesis_secs) ? BigInt(0) : genesis_secs, !isLikeNone(blocks_per_sec), isLikeNone(blocks_per_sec) ? BigInt(0) : blocks_per_sec, verified, head, wall_secs, !isLikeNone(floor), isLikeNone(floor) ? BigInt(0) : floor, floor_age_secs);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BigInt.asUintN(64, ret[0]);
}

/**
 * @param {bigint} chain_id
 * @param {string} genesis_hex
 * @param {string} contract
 * @param {string} selector_hex
 * @param {string} layout_hash_hex
 * @param {bigint} scheme_off
 * @param {bigint} ptr_off
 * @param {bigint} expiry_off
 * @param {string} field_offs_csv
 * @param {string} fields_csv
 * @param {bigint} region_off
 * @param {Uint8Array | number[]} owner_seed_bytes
 * @param {bigint} owner_index
 * @param {bigint} nonce
 * @param {bigint} expiry
 * @returns {string}
 */
export function buildSignedOrderCall(chain_id, genesis_hex, contract, selector_hex, layout_hash_hex, scheme_off, ptr_off, expiry_off, field_offs_csv, fields_csv, region_off, owner_seed_bytes, owner_index, nonce, expiry) {
    let deferred17_0;
    let deferred17_1;
    try {
        const val8 = BigInt.asIntN(64, chain_id);
        const val9 = BigInt.asIntN(64, scheme_off);
        const val10 = BigInt.asIntN(64, ptr_off);
        const val11 = BigInt.asIntN(64, expiry_off);
        const val12 = BigInt.asIntN(64, region_off);
        const val13 = BigInt.asIntN(64, owner_index);
        const val14 = BigInt.asIntN(64, nonce);
        const val15 = BigInt.asIntN(64, expiry);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6;
        try {
            ptr0 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(contract, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(selector_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(layout_hash_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = passStringToWasm0(field_offs_csv, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
            ptr5 = passStringToWasm0(fields_csv, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len5 = WASM_VECTOR_LEN;
            ptr6 = passArray8ToWasm0(owner_seed_bytes, wasm.__wbindgen_malloc);
            len6 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr6) { wasm.__wbindgen_free(ptr6, len6 * 1, 1); }
            if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.buildSignedOrderCall(val8, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, val9, val10, val11, ptr4, len4, ptr5, len5, val12, ptr6, len6, val13, val14, val15);
        var ptr16 = ret[0];
        var len16 = ret[1];
        if (ret[3]) {
            ptr16 = 0; len16 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred17_0 = ptr16;
        deferred17_1 = len16;
        return getStringFromWasm0(ptr16, len16);
    } finally {
        wasm.__wbindgen_free(deferred17_0, deferred17_1, 1);
    }
}

/**
 * @param {bigint} chain_id
 * @param {string} genesis_hex
 * @param {string} contract
 * @param {string} selector_hex
 * @param {string} layout_hash_hex
 * @param {bigint} scheme_off
 * @param {bigint} ptr_off
 * @param {bigint} expiry_off
 * @param {bigint} region_off
 * @param {string} fields_json
 * @param {Uint8Array | number[]} owner_seed_bytes
 * @param {bigint} owner_index
 * @param {bigint} nonce
 * @param {bigint} expiry
 * @returns {string}
 */
export function buildTypedOrderCall(chain_id, genesis_hex, contract, selector_hex, layout_hash_hex, scheme_off, ptr_off, expiry_off, region_off, fields_json, owner_seed_bytes, owner_index, nonce, expiry) {
    let deferred16_0;
    let deferred16_1;
    try {
        const val7 = BigInt.asIntN(64, chain_id);
        const val8 = BigInt.asIntN(64, scheme_off);
        const val9 = BigInt.asIntN(64, ptr_off);
        const val10 = BigInt.asIntN(64, expiry_off);
        const val11 = BigInt.asIntN(64, region_off);
        const val12 = BigInt.asIntN(64, owner_index);
        const val13 = BigInt.asIntN(64, nonce);
        const val14 = BigInt.asIntN(64, expiry);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5;
        try {
            ptr0 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(contract, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(selector_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(layout_hash_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = passStringToWasm0(fields_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
            ptr5 = passArray8ToWasm0(owner_seed_bytes, wasm.__wbindgen_malloc);
            len5 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.buildTypedOrderCall(val7, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, val8, val9, val10, val11, ptr4, len4, ptr5, len5, val12, val13, val14);
        var ptr15 = ret[0];
        var len15 = ret[1];
        if (ret[3]) {
            ptr15 = 0; len15 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred16_0 = ptr15;
        deferred16_1 = len15;
        return getStringFromWasm0(ptr15, len15);
    } finally {
        wasm.__wbindgen_free(deferred16_0, deferred16_1, 1);
    }
}

/**
 * @param {string} name
 * @returns {bigint}
 */
export function chainIdFromName(name) {
    const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.chainIdFromName(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BigInt.asUintN(64, ret[0]);
}

/**
 * @param {string} base
 */
export function checkEndpoint(base) {
    const ptr0 = passStringToWasm0(base, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.checkEndpoint(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {string} response
 */
export function checkGatewayJson(response) {
    const ptr0 = passStringToWasm0(response, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.checkGatewayJson(ptr0, len0);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {bigint} expiry
 * @param {bigint} now_secs
 */
export function checkOrderExpiry(expiry, now_secs) {
    const ret = wasm.checkOrderExpiry(expiry, now_secs);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {bigint} valid_until
 * @param {bigint} head
 */
export function checkValidUntil(valid_until, head) {
    const ret = wasm.checkValidUntil(valid_until, head);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {string} deployer
 * @param {bigint} nonce
 * @returns {string | undefined}
 */
export function contractAddress(deployer, nonce) {
    const val2 = BigInt.asIntN(64, nonce);
    const ptr0 = passStringToWasm0(deployer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.contractAddress(ptr0, len0, val2);
    let v3;
    if (ret[0] !== 0) {
        v3 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v3;
}

/**
 * @param {string} leaf_hex
 * @returns {string}
 */
export function decodeEvent(leaf_hex) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(leaf_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.decodeEvent(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {string} node_info
 * @returns {string}
 */
export function deployFeeQuon(node_info) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(node_info, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.deployFeeQuon(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {bigint} height
 * @returns {string}
 */
export function eventsBody(height) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.eventsBody(height);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {number}
 */
export function gatewayProtocol() {
    const ret = wasm.gatewayProtocol();
    return ret >>> 0;
}

/**
 * @param {string} chain_name
 * @returns {bigint}
 */
export function genesisSecs(chain_name) {
    const ptr0 = passStringToWasm0(chain_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.genesisSecs(ptr0, len0);
    return BigInt.asUintN(64, ret);
}

/**
 * @param {string} chain_name
 * @param {bigint} wall_secs
 * @returns {bigint}
 */
export function headCeiling(chain_name, wall_secs) {
    const val2 = BigInt.asIntN(64, wall_secs);
    const ptr0 = passStringToWasm0(chain_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.headCeiling(ptr0, len0, val2);
    return BigInt.asUintN(64, ret);
}

/**
 * @param {string} header_hex
 * @returns {bigint}
 */
export function headerHeight(header_hex) {
    const ptr0 = passStringToWasm0(header_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.headerHeight(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BigInt.asUintN(64, ret[0]);
}

/**
 * @param {bigint} index
 * @param {string} steps_json
 * @returns {boolean}
 */
export function indexFitsPath(index, steps_json) {
    const val2 = BigInt.asIntN(64, index);
    const ptr0 = passStringToWasm0(steps_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.indexFitsPath(val2, ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * @returns {bigint}
 */
export function localChainId() {
    const ret = wasm.localChainId();
    return BigInt.asUintN(64, ret);
}

/**
 * @param {string} candidate
 * @param {string[]} known
 * @returns {string | undefined}
 */
export function lookalikeOf(candidate, known) {
    let ptr0, len0, ptr1, len1;
    try {
        ptr0 = passStringToWasm0(candidate, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passArrayJsValueToWasm0(known, wasm.__wbindgen_malloc);
        len1 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr1) { wasm.__externref_drop_slice(ptr1, len1); wasm.__wbindgen_free(ptr1, len1 * 4, 4); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.lookalikeOf(ptr0, len0, ptr1, len1);
    let v3;
    if (ret[0] !== 0) {
        v3 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v3;
}

/**
 * @returns {bigint}
 */
export function mainnetChainId() {
    const ret = wasm.mainnetChainId();
    return BigInt.asUintN(64, ret);
}

/**
 * @returns {bigint | undefined}
 */
export function mainnetEpochLength() {
    const ret = wasm.mainnetEpochLength();
    return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
}

/**
 * @returns {string | undefined}
 */
export function mainnetGenesisHash() {
    const ret = wasm.mainnetGenesisHash();
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * @returns {string | undefined}
 */
export function mainnetRosterCommitment() {
    const ret = wasm.mainnetRosterCommitment();
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * @param {bigint} map_domain_tag
 * @param {string} key32_hex
 * @param {bigint} word
 * @returns {string}
 */
export function mapAddrWordKey(map_domain_tag, key32_hex, word) {
    let deferred5_0;
    let deferred5_1;
    try {
        const val2 = BigInt.asIntN(64, map_domain_tag);
        const val3 = BigInt.asIntN(64, word);
        const ptr0 = passStringToWasm0(key32_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mapAddrWordKey(val2, ptr0, len0, val3);
        var ptr4 = ret[0];
        var len4 = ret[1];
        if (ret[3]) {
            ptr4 = 0; len4 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred5_0 = ptr4;
        deferred5_1 = len4;
        return getStringFromWasm0(ptr4, len4);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

/**
 * @param {bigint} map_domain_tag
 * @param {string} key_address_hex
 * @returns {string}
 */
export function mapSlotKey(map_domain_tag, key_address_hex) {
    let deferred4_0;
    let deferred4_1;
    try {
        const val2 = BigInt.asIntN(64, map_domain_tag);
        const ptr0 = passStringToWasm0(key_address_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mapSlotKey(val2, ptr0, len0);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @returns {Uint8Array}
 */
export function mnemonicFromSeed(seed_bytes) {
    const ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mnemonicFromSeed(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * @param {string} label
 * @returns {string}
 */
export function nameKey(label) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.nameKey(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {string} signer_hex
 * @returns {string}
 */
export function nonceSlotKey(signer_hex) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(signer_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.nonceSlotKey(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {string} selector_hex
 * @param {string} fields_json
 * @returns {string}
 */
export function orderLayoutHash(selector_hex, fields_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        let ptr0, len0, ptr1, len1;
        try {
            ptr0 = passStringToWasm0(selector_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(fields_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.orderLayoutHash(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @returns {string}
 */
export function orderSigner(seed_bytes, index) {
    let deferred4_0;
    let deferred4_1;
    try {
        const val2 = BigInt.asIntN(64, index);
        const ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.orderSigner(ptr0, len0, val2);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {string} symbol
 * @returns {bigint}
 */
export function packSymbol(symbol) {
    const ptr0 = passStringToWasm0(symbol, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.packSymbol(ptr0, len0);
    return BigInt.asUintN(64, ret);
}

/**
 * @param {string} response
 * @returns {string}
 */
export function parseEvents(response) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(response, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.parseEvents(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {string} method
 * @returns {bigint}
 */
export function responseCap(method) {
    const ptr0 = passStringToWasm0(method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.responseCap(ptr0, len0);
    return BigInt.asUintN(64, ret);
}

/**
 * @param {bigint} epoch
 * @param {string} roster_json
 * @returns {string}
 */
export function rosterCommitment(epoch, roster_json) {
    let deferred4_0;
    let deferred4_1;
    try {
        const val2 = BigInt.asIntN(64, epoch);
        const ptr0 = passStringToWasm0(roster_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.rosterCommitment(val2, ptr0, len0);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function sameAddress(a, b) {
    let ptr0, len0, ptr1, len1;
    try {
        ptr0 = passStringToWasm0(a, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(b, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.sameAddress(ptr0, len0, ptr1, len1);
    return ret !== 0;
}

/**
 * @param {bigint} slot
 * @returns {string}
 */
export function scalarSlotKey(slot) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.scalarSlotKey(slot);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {string} phrase
 * @returns {Uint8Array}
 */
export function seedFromMnemonic(phrase) {
    const ptr0 = passStringToWasm0(phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.seedFromMnemonic(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * @param {Uint8Array | number[]} phrase
 * @returns {Uint8Array}
 */
export function seedFromMnemonicBytes(phrase) {
    const ptr0 = passArray8ToWasm0(phrase, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.seedFromMnemonicBytes(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @param {string} target
 * @param {string} args_hex
 * @param {string} asset_issuer
 * @param {string} amount
 * @param {bigint} nonce
 * @param {bigint} meter_limit
 * @param {string} fee
 * @param {bigint} chain_id
 * @param {bigint} valid_until
 * @param {string | null | undefined} transfer_fee
 * @param {bigint} head
 * @param {string} genesis_hex
 * @returns {string}
 */
export function signAssetCall(seed_bytes, index, target, args_hex, asset_issuer, amount, nonce, meter_limit, fee, chain_id, valid_until, transfer_fee, head, genesis_hex) {
    let deferred16_0;
    let deferred16_1;
    try {
        const val9 = BigInt.asIntN(64, index);
        const val10 = BigInt.asIntN(64, nonce);
        const val11 = BigInt.asIntN(64, meter_limit);
        const val12 = BigInt.asIntN(64, chain_id);
        const val13 = BigInt.asIntN(64, valid_until);
        const val14 = BigInt.asIntN(64, head);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7;
        try {
            ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(target, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(args_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(asset_issuer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = passStringToWasm0(amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
            ptr5 = passStringToWasm0(fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len5 = WASM_VECTOR_LEN;
            ptr6 = isLikeNone(transfer_fee) ? 0 : passStringToWasm0(transfer_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len6 = WASM_VECTOR_LEN;
            ptr7 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len7 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr7) { wasm.__wbindgen_free(ptr7, len7 * 1, 1); }
            if (ptr6) { wasm.__wbindgen_free(ptr6, len6 * 1, 1); }
            if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.signAssetCall(ptr0, len0, val9, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, val10, val11, ptr5, len5, val12, val13, ptr6, len6, val14, ptr7, len7);
        var ptr15 = ret[0];
        var len15 = ret[1];
        if (ret[3]) {
            ptr15 = 0; len15 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred16_0 = ptr15;
        deferred16_1 = len15;
        return getStringFromWasm0(ptr15, len15);
    } finally {
        wasm.__wbindgen_free(deferred16_0, deferred16_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @param {string} target
 * @param {string} args_hex
 * @param {bigint} nonce
 * @param {bigint} meter_limit
 * @param {string} fee
 * @param {string} value
 * @param {bigint} chain_id
 * @param {bigint} valid_until
 * @param {string | null | undefined} transfer_fee
 * @param {bigint} head
 * @param {string} genesis_hex
 * @returns {string}
 */
export function signPayableCall(seed_bytes, index, target, args_hex, nonce, meter_limit, fee, value, chain_id, valid_until, transfer_fee, head, genesis_hex) {
    let deferred15_0;
    let deferred15_1;
    try {
        const val8 = BigInt.asIntN(64, index);
        const val9 = BigInt.asIntN(64, nonce);
        const val10 = BigInt.asIntN(64, meter_limit);
        const val11 = BigInt.asIntN(64, chain_id);
        const val12 = BigInt.asIntN(64, valid_until);
        const val13 = BigInt.asIntN(64, head);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6;
        try {
            ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(target, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(args_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
            ptr5 = isLikeNone(transfer_fee) ? 0 : passStringToWasm0(transfer_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len5 = WASM_VECTOR_LEN;
            ptr6 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len6 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr6) { wasm.__wbindgen_free(ptr6, len6 * 1, 1); }
            if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.signPayableCall(ptr0, len0, val8, ptr1, len1, ptr2, len2, val9, val10, ptr3, len3, ptr4, len4, val11, val12, ptr5, len5, val13, ptr6, len6);
        var ptr14 = ret[0];
        var len14 = ret[1];
        if (ret[3]) {
            ptr14 = 0; len14 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred15_0 = ptr14;
        deferred15_1 = len14;
        return getStringFromWasm0(ptr14, len14);
    } finally {
        wasm.__wbindgen_free(deferred15_0, deferred15_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @param {bigint} nonce
 * @param {string} fee
 * @param {bigint} chain_id
 * @param {bigint} valid_until
 * @param {bigint} head
 * @param {string} genesis_hex
 * @returns {string}
 */
export function signRegister(seed_bytes, index, nonce, fee, chain_id, valid_until, head, genesis_hex) {
    let deferred10_0;
    let deferred10_1;
    try {
        const val4 = BigInt.asIntN(64, index);
        const val5 = BigInt.asIntN(64, nonce);
        const val6 = BigInt.asIntN(64, chain_id);
        const val7 = BigInt.asIntN(64, valid_until);
        const val8 = BigInt.asIntN(64, head);
        let ptr0, len0, ptr1, len1, ptr2, len2;
        try {
            ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.signRegister(ptr0, len0, val4, val5, ptr1, len1, val6, val7, val8, ptr2, len2);
        var ptr9 = ret[0];
        var len9 = ret[1];
        if (ret[3]) {
            ptr9 = 0; len9 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred10_0 = ptr9;
        deferred10_1 = len9;
        return getStringFromWasm0(ptr9, len9);
    } finally {
        wasm.__wbindgen_free(deferred10_0, deferred10_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @param {string} target
 * @param {string} args_hex
 * @param {bigint} nonce
 * @param {bigint} meter_limit
 * @param {string} fee
 * @param {bigint} chain_id
 * @param {bigint} valid_until
 * @param {string | null | undefined} transfer_fee
 * @param {bigint} head
 * @param {string} genesis_hex
 * @returns {string}
 */
export function sign_call(seed_bytes, index, target, args_hex, nonce, meter_limit, fee, chain_id, valid_until, transfer_fee, head, genesis_hex) {
    let deferred14_0;
    let deferred14_1;
    try {
        const val7 = BigInt.asIntN(64, index);
        const val8 = BigInt.asIntN(64, nonce);
        const val9 = BigInt.asIntN(64, meter_limit);
        const val10 = BigInt.asIntN(64, chain_id);
        const val11 = BigInt.asIntN(64, valid_until);
        const val12 = BigInt.asIntN(64, head);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5;
        try {
            ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(target, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(args_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = isLikeNone(transfer_fee) ? 0 : passStringToWasm0(transfer_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
            ptr5 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len5 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.sign_call(ptr0, len0, val7, ptr1, len1, ptr2, len2, val8, val9, ptr3, len3, val10, val11, ptr4, len4, val12, ptr5, len5);
        var ptr13 = ret[0];
        var len13 = ret[1];
        if (ret[3]) {
            ptr13 = 0; len13 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred14_0 = ptr13;
        deferred14_1 = len13;
        return getStringFromWasm0(ptr13, len13);
    } finally {
        wasm.__wbindgen_free(deferred14_0, deferred14_1, 1);
    }
}

/**
 * @param {Uint8Array | number[]} seed_bytes
 * @param {bigint} index
 * @param {string} to
 * @param {string} amount
 * @param {bigint} nonce
 * @param {string} fee
 * @param {bigint} chain_id
 * @param {bigint} valid_until
 * @param {bigint} head
 * @param {string} genesis_hex
 * @returns {string}
 */
export function sign_transfer(seed_bytes, index, to, amount, nonce, fee, chain_id, valid_until, head, genesis_hex) {
    let deferred12_0;
    let deferred12_1;
    try {
        const val6 = BigInt.asIntN(64, index);
        const val7 = BigInt.asIntN(64, nonce);
        const val8 = BigInt.asIntN(64, chain_id);
        const val9 = BigInt.asIntN(64, valid_until);
        const val10 = BigInt.asIntN(64, head);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4;
        try {
            ptr0 = passArray8ToWasm0(seed_bytes, wasm.__wbindgen_malloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(to, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.sign_transfer(ptr0, len0, val6, ptr1, len1, ptr2, len2, val7, ptr3, len3, val8, val9, val10, ptr4, len4);
        var ptr11 = ret[0];
        var len11 = ret[1];
        if (ret[3]) {
            ptr11 = 0; len11 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred12_0 = ptr11;
        deferred12_1 = len11;
        return getStringFromWasm0(ptr11, len11);
    } finally {
        wasm.__wbindgen_free(deferred12_0, deferred12_1, 1);
    }
}

export function start() {
    wasm.start();
}

/**
 * @param {string} contract
 * @returns {string}
 */
export function storageBody(contract) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(contract, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.storageBody(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {string} response
 * @param {string} slot_key_hex
 * @returns {string}
 */
export function storageValue(response, slot_key_hex) {
    let deferred4_0;
    let deferred4_1;
    try {
        let ptr0, len0, ptr1, len1;
        try {
            ptr0 = passStringToWasm0(response, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(slot_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.storageValue(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @param {string} response
 * @param {string} slot_key_hex
 * @returns {string | undefined}
 */
export function storageValueReported(response, slot_key_hex) {
    let ptr0, len0, ptr1, len1;
    try {
        ptr0 = passStringToWasm0(response, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(slot_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.storageValueReported(ptr0, len0, ptr1, len1);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    let v3;
    if (ret[0] !== 0) {
        v3 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v3;
}

/**
 * @param {string} tx_hex
 * @returns {string}
 */
export function submit_body(tx_hex) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(tx_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.submit_body(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @returns {bigint}
 */
export function testnetBlocksPerSec() {
    const ret = wasm.testnetBlocksPerSec();
    return BigInt.asUintN(64, ret);
}

/**
 * @returns {bigint}
 */
export function testnetChainId() {
    const ret = wasm.testnetChainId();
    return BigInt.asUintN(64, ret);
}

/**
 * @returns {string}
 */
export function testnetChainName() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.testnetChainName();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {bigint | undefined}
 */
export function testnetEpochLength() {
    const ret = wasm.testnetEpochLength();
    return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
}

/**
 * @returns {string | undefined}
 */
export function testnetGenesisHash() {
    const ret = wasm.testnetGenesisHash();
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * @returns {bigint}
 */
export function testnetGenesisSecs() {
    const ret = wasm.testnetGenesisSecs();
    return BigInt.asUintN(64, ret);
}

/**
 * @returns {string | undefined}
 */
export function testnetRosterCommitment() {
    const ret = wasm.testnetRosterCommitment();
    let v1;
    if (ret[0] !== 0) {
        v1 = getStringFromWasm0(ret[0], ret[1]);
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v1;
}

/**
 * @returns {string}
 */
export function testnetRpcUrl() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.testnetRpcUrl();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {bigint}
 */
export function tokenDecimalsSlot() {
    const ret = wasm.tokenDecimalsSlot();
    return BigInt.asUintN(64, ret);
}

/**
 * @returns {bigint}
 */
export function tokenSymbolSlot() {
    const ret = wasm.tokenSymbolSlot();
    return BigInt.asUintN(64, ret);
}

/**
 * @param {string} leaf_hex
 * @returns {string}
 */
export function transactionKind(leaf_hex) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(leaf_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transactionKind(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {string} tx_id
 * @returns {string}
 */
export function transaction_body(tx_id) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(tx_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transaction_body(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * @param {bigint} word
 * @returns {string}
 */
export function unpackSymbol(word) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.unpackSymbol(word);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @param {string} address
 * @returns {boolean}
 */
export function valid_address(address) {
    const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.valid_address(ptr0, len0);
    return ret !== 0;
}

/**
 * @returns {bigint}
 */
export function validityBlocks() {
    const ret = wasm.validityBlocks();
    return BigInt.asUintN(64, ret);
}

/**
 * @param {bigint} chain_id
 * @param {string} genesis_hex
 * @param {bigint} epoch_length
 * @param {bigint} epoch
 * @param {string} roster_json
 * @param {string} address
 * @param {string} header_hex
 * @param {string} certificate_hex
 * @param {string} proof_hex
 * @returns {string}
 */
export function verifyAccount(chain_id, genesis_hex, epoch_length, epoch, roster_json, address, header_hex, certificate_hex, proof_hex) {
    let deferred11_0;
    let deferred11_1;
    try {
        const val7 = BigInt.asIntN(64, chain_id);
        const val8 = BigInt.asIntN(64, epoch_length);
        const val9 = BigInt.asIntN(64, epoch);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5;
        try {
            ptr0 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(roster_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(header_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
            ptr4 = passStringToWasm0(certificate_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len4 = WASM_VECTOR_LEN;
            ptr5 = passStringToWasm0(proof_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len5 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
            if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.verifyAccount(val7, ptr0, len0, val8, val9, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
        var ptr10 = ret[0];
        var len10 = ret[1];
        if (ret[3]) {
            ptr10 = 0; len10 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred11_0 = ptr10;
        deferred11_1 = len10;
        return getStringFromWasm0(ptr10, len10);
    } finally {
        wasm.__wbindgen_free(deferred11_0, deferred11_1, 1);
    }
}

/**
 * @param {string} event_root_hex
 * @param {string} leaf_hex
 * @param {string} steps_json
 * @returns {boolean}
 */
export function verifyEvent(event_root_hex, leaf_hex, steps_json) {
    let ptr0, len0, ptr1, len1, ptr2, len2;
    try {
        ptr0 = passStringToWasm0(event_root_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(leaf_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passStringToWasm0(steps_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len2 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.verifyEvent(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * @param {bigint} chain_id
 * @param {string} genesis_hex
 * @param {string} header_hex
 * @param {string} certificate_hex
 * @param {string} roster_json
 * @returns {string}
 */
export function verifyFinality(chain_id, genesis_hex, header_hex, certificate_hex, roster_json) {
    let deferred7_0;
    let deferred7_1;
    try {
        const val5 = BigInt.asIntN(64, chain_id);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3;
        try {
            ptr0 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(header_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(certificate_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(roster_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.verifyFinality(val5, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        var ptr6 = ret[0];
        var len6 = ret[1];
        if (ret[3]) {
            ptr6 = 0; len6 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred7_0 = ptr6;
        deferred7_1 = len6;
        return getStringFromWasm0(ptr6, len6);
    } finally {
        wasm.__wbindgen_free(deferred7_0, deferred7_1, 1);
    }
}

/**
 * @param {bigint} chain_id
 * @param {string} genesis_hex
 * @param {bigint} epoch_length
 * @param {bigint} epoch
 * @param {string} header_hex
 * @param {string} certificate_hex
 * @param {string} roster_json
 * @returns {string}
 */
export function verifyFinalityInEpoch(chain_id, genesis_hex, epoch_length, epoch, header_hex, certificate_hex, roster_json) {
    let deferred9_0;
    let deferred9_1;
    try {
        const val5 = BigInt.asIntN(64, chain_id);
        const val6 = BigInt.asIntN(64, epoch_length);
        const val7 = BigInt.asIntN(64, epoch);
        let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3;
        try {
            ptr0 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len0 = WASM_VECTOR_LEN;
            ptr1 = passStringToWasm0(header_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len1 = WASM_VECTOR_LEN;
            ptr2 = passStringToWasm0(certificate_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len2 = WASM_VECTOR_LEN;
            ptr3 = passStringToWasm0(roster_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            len3 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
            if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
            if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
            throw e;
        }
        const ret = wasm.verifyFinalityInEpoch(val5, ptr0, len0, val6, val7, ptr1, len1, ptr2, len2, ptr3, len3);
        var ptr8 = ret[0];
        var len8 = ret[1];
        if (ret[3]) {
            ptr8 = 0; len8 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred9_0 = ptr8;
        deferred9_1 = len8;
        return getStringFromWasm0(ptr8, len8);
    } finally {
        wasm.__wbindgen_free(deferred9_0, deferred9_1, 1);
    }
}

/**
 * @param {bigint} chain_id
 * @param {string} genesis_hex
 * @param {bigint} epoch_length
 * @param {bigint} current_epoch
 * @param {string} current_roster_json
 * @param {string} header_hex
 * @param {string} certificate_hex
 * @param {string} next_roster_json
 * @param {string} proof_hex
 * @returns {bigint}
 */
export function verifyNextRoster(chain_id, genesis_hex, epoch_length, current_epoch, current_roster_json, header_hex, certificate_hex, next_roster_json, proof_hex) {
    const val7 = BigInt.asIntN(64, chain_id);
    const val8 = BigInt.asIntN(64, epoch_length);
    const val9 = BigInt.asIntN(64, current_epoch);
    let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5;
    try {
        ptr0 = passStringToWasm0(genesis_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(current_roster_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passStringToWasm0(header_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len2 = WASM_VECTOR_LEN;
        ptr3 = passStringToWasm0(certificate_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len3 = WASM_VECTOR_LEN;
        ptr4 = passStringToWasm0(next_roster_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len4 = WASM_VECTOR_LEN;
        ptr5 = passStringToWasm0(proof_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len5 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr5) { wasm.__wbindgen_free(ptr5, len5 * 1, 1); }
        if (ptr4) { wasm.__wbindgen_free(ptr4, len4 * 1, 1); }
        if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.verifyNextRoster(val7, ptr0, len0, val8, val9, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return BigInt.asUintN(64, ret[0]);
}

/**
 * @param {string} transaction_root_hex
 * @param {string} tx_id
 * @param {string} leaf_hex
 * @param {string} steps_json
 * @returns {boolean}
 */
export function verifyTransaction(transaction_root_hex, tx_id, leaf_hex, steps_json) {
    let ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3;
    try {
        ptr0 = passStringToWasm0(transaction_root_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len0 = WASM_VECTOR_LEN;
        ptr1 = passStringToWasm0(tx_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len1 = WASM_VECTOR_LEN;
        ptr2 = passStringToWasm0(leaf_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len2 = WASM_VECTOR_LEN;
        ptr3 = passStringToWasm0(steps_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        len3 = WASM_VECTOR_LEN;
    } catch (e) {
        if (ptr3) { wasm.__wbindgen_free(ptr3, len3 * 1, 1); }
        if (ptr2) { wasm.__wbindgen_free(ptr2, len2 * 1, 1); }
        if (ptr1) { wasm.__wbindgen_free(ptr1, len1 * 1, 1); }
        if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 1, 1); }
        throw e;
    }
    const ret = wasm.verifyTransaction(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
}

/**
 * @param {string} transfer_fee
 * @param {bigint} meter_limit
 * @returns {string}
 */
export function vmCallFee(transfer_fee, meter_limit) {
    let deferred4_0;
    let deferred4_1;
    try {
        const val2 = BigInt.asIntN(64, meter_limit);
        const ptr0 = passStringToWasm0(transfer_fee, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.vmCallFee(ptr0, len0, val2);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * @returns {string}
 */
export function vmDeployAddress() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.vmDeployAddress();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}
export function __wbg_Error_208446807d0d1e30(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return ret;
}
export function __wbg___wbindgen_string_get_7ce8eee7fd327545(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
    getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
}
export function __wbg___wbindgen_throw_4c88d8bf264fd984(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbg_getRandomValues_bdd44c26d13cd733() { return handleError(function (arg0, arg1) {
    const ret = globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
    return ret;
}, arguments); }
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    table.set(0, undefined);
    table.set(1024, undefined);
    table.set(1025, null);
    table.set(1026, true);
    table.set(1027, false);
}
const SigningSessionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_signingsession_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayU64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigUint64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedBigUint64ArrayMemory0 = null;
function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
    numBytesDecoded += bytes.length;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
        cachedTextDecoder.decode();
        numBytesDecoded = bytes.length;
    }
    return cachedTextDecoder.decode(bytes);
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
