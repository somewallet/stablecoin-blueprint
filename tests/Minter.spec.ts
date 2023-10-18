import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { JettonWallet } from 'ton';
import { describe } from 'node:test';

describe('Minter', () => {

    let code: Cell;

    beforeAll(async () => {
        code = await compile('Minter');
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;
    let deployer: SandboxContract<TreasuryContract>
    let owner: SandboxContract<TreasuryContract>
    let ownerJettonWallet: SandboxContract<JettonWallet>

    beforeEach(async () => {

        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner');

        minter = blockchain.openContract(Minter.createFromConfig(
            {
                totalSupply: toNano('100000000'),
                adminAddress: owner.address,
                transferAdminAddress: owner.address,
                managerAddress: owner.address,
                jettonWalletCode: await compile('JettonWallet'),
        }, code));


        await blockchain.setVerbosityForAddress(minter.address, {
            print: true,
            blockchainLogs: true,
            vmLogs: 'vm_logs',
            debugLogs: false,
        })

    });

    it('should deploy', async () => {

        const stableMinterDeployResult = await minter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(stableMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });

    })

    it('should mint tokens', async () => {

        let mintOwnerStables = await minter.sendMint(owner.getSender(), owner.address, toNano(0.05), BigInt(1e9 * 1000));

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

    })

});
