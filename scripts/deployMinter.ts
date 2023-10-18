import { toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('provider.sender().address', provider.sender().address);

    const minter = provider.open(

        Minter.createFromConfig(
            {
                totalSupply: toNano('100000000'),
                adminAddress: provider.sender().address!,
                managerAddress: provider.sender().address!,
                jettonWalletCode: await compile('Minter'),
            },
            await compile('Minter')
        )
    );

    await minter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(minter.address);

    // run methods on `minter`
}
