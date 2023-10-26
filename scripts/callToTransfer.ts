import { toNano, address, beginCell } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {

    console.log('provider.sender().address', provider.sender().address);

    const minter = provider.open(Minter.createFromAddress(address('EQCCR5CbsztSlbc1ifGDZesWc5n_sOWxm-33yWJHwPvHiLID')));

    await minter.sendCallToTransfer(
        provider.sender(), // sender
        toNano(0.1), // fee
        address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'), // to user address
        toNano(0.1),
        toNano(777),
        address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'), // from user address
        address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'), // response address
        beginCell().endCell(),
        toNano(0.05),
        BigInt(-1),
        beginCell().endCell()
    );

}
