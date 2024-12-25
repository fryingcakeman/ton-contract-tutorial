import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type CounterConfig = {
    counter: number,
    id: number
};

export function counterConfigToCell(config: CounterConfig): Cell {
    return beginCell()
        .storeUint(config.counter, 32)
        .storeUint(config.id, 32)
        .endCell();
}

export class Counter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Counter(address);
    }

    static createFromConfig(config: CounterConfig, code: Cell, workchain = 0) {
        const data = counterConfigToCell(config);
        const init = { code, data };
        return new Counter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }


    async sendIncrement(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value, // TON 币数量
            sendMode: SendMode.PAY_GAS_SEPARATELY, // 指定gas将与消息值分开支付
            body: beginCell().storeUint(1, 32).endCell() // 操作码
        })
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('get_counter', []);
        return result.stack.readNumber();
    }

    async getId(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }
}
