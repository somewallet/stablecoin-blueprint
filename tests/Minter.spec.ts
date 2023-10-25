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
    let adminJettonWallet: SandboxContract<JettonWallet>;
    let deployer: SandboxContract<TreasuryContract>;
    let admin: SandboxContract<TreasuryContract>;
    let newAdmin: SandboxContract<TreasuryContract>;
    let transferAdmin: SandboxContract<TreasuryContract>;
    let manager: SandboxContract<TreasuryContract>;

    beforeEach(async () => {

        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        admin = await blockchain.treasury('admin');
        newAdmin = await blockchain.treasury('newAdmin');
        transferAdmin = await blockchain.treasury('transferAdmin');
        manager = await blockchain.treasury('manager');

        minter = blockchain.openContract(Minter.createFromConfig({

                totalSupply: toNano(700000000),
                adminAddress: admin.address,
                transferAdminAddress: transferAdmin.address,
                managerAddress: manager.address,
                jettonWalletCode: await compile('JettonWallet')

            }, code
        ));

        const stableMinterDeployResult = await minter.sendDeploy(deployer.getSender(), toNano(0.0777));
        adminJettonWallet = blockchain.openContract(JettonWallet.createFromAddress(await minter.getWalletAddress(admin.address)));

        const jettonData = await minter.getJettonData();

        expect(jettonData.totalSupply).toBe(toNano(700000000));
        expect(jettonData.flag).toBe(Number(-1));
        expect(jettonData.adminAddress).toEqualAddress(admin.address);

        const jettonManager = await minter.getJettonManager();

        expect(jettonManager).toEqualAddress(manager.address);

        expect(stableMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });

        const mintStablesToAdmin = await minter.sendMint(
            
            admin.getSender(), 
            toNano(0.1), 
            toNano(0.05), 
            admin.address, 
            toNano(300000000)

        );

        expect(mintStablesToAdmin.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true
        });

        expect(mintStablesToAdmin.transactions).toHaveTransaction({
            from: minter.address,
            to: adminJettonWallet.address,
            success: true
        });

        expect(await adminJettonWallet.getJettonBalance()).toBe(toNano(300000000));
        expect((await minter.getJettonData()).totalSupply).toBe(toNano(1000000000));

    });

    it('should change admin', async () => {

        await blockchain.setVerbosityForAddress(minter.address, {
            print: true,
            blockchainLogs: true,
            vmLogs: 'vm_logs',
            debugLogs: false,
        })

        const addTransferAdminResult = await minter.sendChangeAdmin(admin.getSender(), toNano(0.1), newAdmin.address);

        expect(addTransferAdminResult.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            success: true,
            op: 3
        });

        const claimAdminResult = await minter.sendClaimAdmin(newAdmin.getSender(), toNano(0.1));

        expect(claimAdminResult.transactions).toHaveTransaction({
            from: newAdmin.address,
            to: minter.address,
            success: true,
            op: 4
        });

        expect((await minter.getJettonData()).adminAddress).toEqualAddress(newAdmin.address);

    });

    it('should burn tokens', async () => {

        const burnAdminStables = await adminJettonWallet.sendBurn(

            admin.getSender(), 
            admin.address,
            toNano(0.1),
            toNano(1000)

        );

        expect(burnAdminStables.transactions).toHaveTransaction({
            from: admin.address,
            to: adminJettonWallet.address,
            success: true
        });

        expect(burnAdminStables.transactions).toHaveTransaction({
            from: adminJettonWallet.address,
            to: minter.address,
            success: true
        });

        expect(await adminJettonWallet.getJettonBalance()).toBe(toNano(300000000 - 1000));

        const jettonData = await minter.getJettonData();

        expect(jettonData.totalSupply).toBe(toNano(1000000000 - 1000));

    });

});
