import { Address, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Address of recepient'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const minter = provider.open(Minter.createFromAddress(address));

    await minter.sendMint(provider.sender(), provider.sender().address as Address, toNano(0.05), BigInt(1e10));

    ui.write('Waiting for mint...');

    ui.clearActionPrompt();
    ui.write('mint successfully!');
}
