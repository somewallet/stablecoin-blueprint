import { toNano, address } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {

    console.log('provider.sender().address', provider.sender().address);

    const minter = provider.open(

        Minter.createFromConfig(
            {

                totalSupply: toNano(1000000000),
                adminAddress: address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'),
                transferAdminAddress: address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'),
                managerAddress: address('EQDNU1IyaUByY-bzYEX43eHG5fsDdgmh_Ev5O5O-Fe8tpoWD'),
                jettonWalletCode: await compile('JettonWallet')

            },
            await compile('Minter')
        )
    );

    await minter.sendDeploy(provider.sender(), toNano('0.07'));

    await provider.waitForDeploy(minter.address);

    // run methods on `minter`
}
