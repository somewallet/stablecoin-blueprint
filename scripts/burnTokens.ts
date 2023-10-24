import { toNano, address } from 'ton-core';
import { JettonWallet } from '../wrappers/JettonWallet';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {

    const userJettonWallet = provider.open(JettonWallet.createFromAddress(address('EQD1rOSFrZZBdFWFR4AMyE--cz5QxMnQKe4_Y-uAWCRgQJ2e')));

    await userJettonWallet.sendBurn(
        provider.sender(), 
        address('UQDWfTV0XtuUrRYF8BqOm1U2yr3axYlpvxxnGXyx2nwIys7y'),
        toNano('0.05'),
        toNano(1000)
    );

}
