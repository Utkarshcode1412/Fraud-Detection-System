const asyncHandler = require('../utils/asyncHandler');
const transactionService = require('../services/transactionService');

const submitTransaction = asyncHandler(async (req, res) => {
  const result = await transactionService.submitTransaction(req.body);
  res.status(201).json(result);
});

const getTransaction = asyncHandler(async (req, res) => {
  const tx = await transactionService.getTransactionDetail(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  res.status(200).json(tx);
});

const listTransactions = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20, riskLevel, minAmount, maxAmount, search } = req.query;
  const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const { rows, total } = await transactionService.listTransactions({
    limit, offset, riskLevel: riskLevel || null,
    minAmount: minAmount ? parseFloat(minAmount) : null,
    maxAmount: maxAmount ? parseFloat(maxAmount) : null,
    search: search || null,
  });

  res.status(200).json({
    data: rows,
    pagination: { page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = { submitTransaction, getTransaction, listTransactions };
