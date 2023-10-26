import { toNano, address, beginCell } from 'ton-core';
import { JettonWallet } from '../wrappers/JettonWallet';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {

    const userJettonWallet = provider.open(JettonWallet.createFromAddress(address('EQD1rOSFrZZBdFWFR4AMyE--cz5QxMnQKe4_Y-uAWCRgQJ2e')));

    await userJettonWallet.sendTransfer(
        provider.sender(), 
        toNano(0.1),
        toNano(0.1),
        beginCell().endCell(),
        address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'), // recipient
        toNano(1000)
    );

}
