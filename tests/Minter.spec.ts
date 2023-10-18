import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { JettonWallet } from 'ton';

describe('Minter', () => {

    let code: Cell;

    beforeAll(async () => {
        code = await compile('Minter');
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;
    let owner: SandboxContract<TreasuryContract>
    let ownerJettonWallet: SandboxContract<JettonWallet>

    beforeEach(async () => {

        blockchain = await Blockchain.create();

        const deployer = await blockchain.treasury('deployer');
        

        minter = blockchain.openContract(Minter.createFromConfig(
            {
                totalSupply: toNano('100000000'),
                adminAddress: deployer.getSender().address,
                managerAddress: deployer.getSender().address,
                jettonWalletCode: await compile('JettonWallet'),
        }, code));


        await blockchain.setVerbosityForAddress(minter.address, {
            print: true,
            blockchainLogs: true,
            vmLogs: 'vm_logs',
            debugLogs: false,
        })

        const stableMinterDeployResult = await minter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(stableMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });

    });

    it('should deploy', async () => {

    });

    it('should mint tokens', async () => {

        owner = await blockchain.treasury('owner');
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

    });

});
