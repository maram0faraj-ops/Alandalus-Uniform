// --- واجهة برمجة التطبيقات لمخطط حالة الدفع (النسخة النهائية المصححة) ---
router.get('/stage-payment-stats', async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      // الخطوة 1: الربط مع جدول المخزون
      {
        $lookup: {
          from: 'inventories', // اسم جدول المخزون (تأكد من أنه صحيح)
          localField: 'inventoryItem',
          foreignField: '_id',
          as: 'inventoryDetails'
        }
      },
      { $unwind: '$inventoryDetails' },
      // الخطوة 2: الربط مع جدول الزي
      {
        $lookup: {
          from: 'uniforms', // اسم جدول الزي (تأكد من أنه صحيح)
          localField: 'inventoryDetails.uniform',
          foreignField: '_id', // <-- هذا هو السطر الذي تم تصحيحه
          as: 'uniformDetails'
        }
      },
      { $unwind: '$uniformDetails' },
      // الخطوة 3: التجميع النهائي
      {
        $group: {
          _id: {
            stage: "$uniformDetails.stage", 
            paymentType: "$uniformDetails.paymentType"
          },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stage payment stats:", err);
    res.status(500).send('Server Error');
  }
}); 