import { toNano, address } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {

    console.log('provider.sender().address', provider.sender().address);

    const minter = provider.open(Minter.createFromAddress(address('EQCCR5CbsztSlbc1ifGDZesWc5n_sOWxm-33yWJHwPvHiLID')));

    await minter.sendClaimAdmin(
        provider.sender(), // sender
        toNano(0.1) // fee
    );

}
