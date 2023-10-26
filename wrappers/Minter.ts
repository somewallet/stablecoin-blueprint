import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from 'ton-core';

export type MinterConfig = {
    totalSupply: bigint;
    adminAddress: Address;
    transferAdminAddress: Address;
    managerAddress: Address;
    jettonWalletCode: Cell;
};

export function minterConfigToCell(config: MinterConfig): Cell {
    return beginCell()
        .storeCoins(config.totalSupply)
        .storeAddress(config.adminAddress)
        .storeAddress(config.transferAdminAddress)
        .storeAddress(config.managerAddress)
        .storeRef(config.jettonWalletCode)
        .endCell();
};

export type jettonData = {
    totalSupply: bigint;
    flag: number;
    adminAddress: Address;
    buildContentCell: Cell;
    jettonWalletCode: Cell;
};

export const Opcodes = {
    internal_transfer: 0x178d4519,
    mint: 21,
    burn: 0x595f07bc,
    change_admin: 3,
    claim_admin: 4,
    upgrade: 5,
    call_to: 6,
    change_manager: 7,
    provide_wallet_address: 0x2c76b973,
    transfer: 0xf8a7ea5,
    set_status: 100
};

export class Minter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {};

    static createFromAddress(address: Address) {
        return new Minter(address);
    };

    static createFromConfig(config: MinterConfig, code: Cell, workchain = 0) {
        const data = minterConfigToCell(config);
        const init = { code, data };
        return new Minter(contractAddress(workchain, init), init);
    };

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    };

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        forward_fee: bigint,
        address: Address,
        amount: bigint
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.mint, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                    .storeCoins(forward_fee)
                    .storeRef(
                        beginCell()
                            .storeUint(Opcodes.internal_transfer, 32)
                            .storeUint(0, 64)
                            .storeCoins(amount)
                            .storeAddress(address) // TODO FROM?
                            .storeAddress(address) // TODO RESP?
                            .storeCoins(0)
                            .storeBit(false) // forward_payload in this slice, not separate cell
                        .endCell()
                    )
                .endCell()
        });
    };

    async sendCallToTransfer(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        address: Address,
        amount: bigint,
        jettonAmount: bigint,
        toOwnerAddress: Address,
        responseAddress: Address,
        customPayload: Cell,
        forwardTonAmount: bigint,
        forwardPayloadFlag: bigint,
        forwardPayload: Cell
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.call_to, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                    .storeCoins(amount)
                    .storeRef(
                        beginCell()
                            .storeUint(Opcodes.transfer, 32)
                            .storeUint(0, 64)
                            .storeCoins(jettonAmount)
                            .storeAddress(toOwnerAddress)
                            .storeAddress(responseAddress)
                            .storeMaybeRef(customPayload)
                            .storeCoins(forwardTonAmount)
                            .storeInt(forwardPayloadFlag, 1)
                            .storeRef(forwardPayload)
                        .endCell()
                    )
                .endCell()
        });

    };

    async sendCallToBurn(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        address: Address,
        amount: bigint,
        jettonAmount: bigint,
        responseAddress: Address
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.call_to, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                    .storeCoins(amount)
                    .storeRef(
                        beginCell()
                            .storeUint(Opcodes.burn, 32)
                            .storeUint(0, 64)
                            .storeCoins(jettonAmount)
                            .storeAddress(responseAddress)
                            .storeMaybeRef()
                        .endCell()
                    )
                .endCell()
        });

    };

    async sendCallToSetStatus(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        address: Address,
        amount: bigint,
        new_status: bigint
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.call_to, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                    .storeCoins(amount)
                    .storeRef(
                        beginCell()
                            .storeUint(Opcodes.set_status, 32)
                            .storeUint(0, 64)
                            .storeUint(new_status, 4)
                        .endCell()
                    )
                .endCell()
        });

    };

    async sendProvideWalletAddress(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        address: Address,
        flag: number
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.provide_wallet_address, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                    .storeUint(flag, 1)
                .endCell()
        });
    };

    async sendChangeAdmin(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        address: Address
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.change_admin, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                .endCell()
        });
    };


    async sendClaimAdmin(
        provider: ContractProvider,
        via: Sender,
        fee: bigint
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.claim_admin, 32)
                    .storeUint(0, 64)
                .endCell()
        });
    };

    async sendChangeManager(
        provider: ContractProvider,
        via: Sender,
        fee: bigint,
        address: Address
    ) {
        await provider.internal(via, {
            value: fee,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(Opcodes.change_manager, 32)
                    .storeUint(0, 64)
                    .storeAddress(address)
                .endCell()
        });
    };

    async getJettonData(provider: ContractProvider): Promise<jettonData> {

        const { stack } = await provider.get('get_jetton_data', []);

        return {
            totalSupply: stack.readBigNumber(),
            flag: stack.readNumber(),
            adminAddress: stack.readAddress(),
            buildContentCell: stack.readCell(),
            jettonWalletCode: stack.readCell()
        };

    };

    async getJettonManager(provider: ContractProvider): Promise<Address> {
        const res = await provider.get('get_jetton_manager', []);
        return res.stack.readAddress();
    };

    async getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
        const res = await provider.get('get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(owner).endCell() }]);
        return res.stack.readAddress();
    };

}