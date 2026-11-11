import { Router } from 'express';
import * as nftController from '../controllers/nft.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listNftRules, nftIdRules, recordMintRules } from '../validators/nft.validators.js';

const router = Router();

router.use(authenticate);

router.post('/mint', validate(recordMintRules), nftController.recordMint);
router.get('/mine', validate(listNftRules), nftController.listMine);
router.get('/:id', validate(nftIdRules), nftController.getOne);
router.post('/:id/verify-owner', validate(nftIdRules), nftController.verifyOwner);

export default router;
