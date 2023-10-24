import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { describe } from 'node:test';
import { JettonWallet } from "../wrappers/JettonWallet";

describe('Minter', () => {

    let code: Cell;

    beforeAll(async () => {
        code = await compile('Minter');
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;
    let ownerJettonWallet: SandboxContract<JettonWallet>
    let deployer: SandboxContract<TreasuryContract>
    let owner: SandboxContract<TreasuryContract>

    beforeEach(async () => {

        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner');

        minter = blockchain.openContract(Minter.createFromConfig({

                totalSupply: toNano('100000000'),
                adminAddress: owner.address,
                transferAdminAddress: owner.address,
                managerAddress: owner.address,
                jettonWalletCode: await compile('JettonWallet')

            }, code
        ));

        await blockchain.setVerbosityForAddress(minter.address, {
            print: true,
            blockchainLogs: true,
            vmLogs: 'vm_logs',
            debugLogs: false,
        })

        const stableMinterDeployResult = await minter.sendDeploy(deployer.getSender(), toNano('0.05'));
        ownerJettonWallet = await blockchain.openContract(JettonWallet.createFromAddress(await minter.getWalletAddress(owner.address)));

        expect(stableMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });

        let mintOwnerStables = await minter.sendMint(owner.getSender(), owner.address, toNano(0.1), toNano(0.05), toNano(20000));

        expect(mintOwnerStables.transactions).toHaveTransaction({
            from: owner.address,
            to: minter.address,
            success: true
        });

        expect(mintOwnerStables.transactions).toHaveTransaction({
            from: minter.address,
            to: ownerJettonWallet.address,
            success: true
        });

        expect(await ownerJettonWallet.getJettonBalance()).toBe(toNano(20000))

    });

    it('should burn tokens', async () => {

        let burnOwnerStables = await ownerJettonWallet.sendBurn(

            owner.getSender(), 
            owner.address,
            toNano(0.1),
            toNano(1000)

        );

        expect(burnOwnerStables.transactions).toHaveTransaction({
            from: owner.address,
            to: ownerJettonWallet.address,
            success: true
        });

        expect(burnOwnerStables.transactions).toHaveTransaction({
            from: ownerJettonWallet.address,
            to: minter.address,
            success: true
        });

        expect(await ownerJettonWallet.getJettonBalance()).toBe(toNano(20000 - 1000))

    })

});
