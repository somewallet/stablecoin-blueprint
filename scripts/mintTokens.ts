import { toNano, address } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {

    console.log('provider.sender().address', provider.sender().address);

    const minter = provider.open(Minter.createFromAddress(address('EQCCR5CbsztSlbc1ifGDZesWc5n_sOWxm-33yWJHwPvHiLID')));

    await minter.sendMint(
        provider.sender(), // sender
        toNano(0.1), // fee
        toNano(0.05), // forward_fee
        address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'), // to address
        toNano(20000) // mint amount
    );

}
