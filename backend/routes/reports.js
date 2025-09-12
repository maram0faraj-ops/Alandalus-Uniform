const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const Uniform = require('../models/Uniform');
const ExcelJS = require('exceljs');

// Helper function to build date queries
const buildDateQuery = (from, to) => {
    const dateQuery = {};
    if (from) {
        const startDate = new Date(from);
        startDate.setUTCHours(0, 0, 0, 0);
        dateQuery.$gte = startDate;
    }
    if (to) {
        const endDate = new Date(to);
        endDate.setUTCHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
    }
    return Object.keys(dateQuery).length > 0 ? dateQuery : null;
};

// --- Delivery Report Route ---
router.post('/delivery-export', async (req, res) => {
    try {
        const { stage, grade, section, deliveryDateFrom, deliveryDateTo } = req.body;
        const query = {};

        if (stage) query.stage = stage;
        if (grade) query.grade = grade;
        if (section) query.section = section;
        const dateQuery = buildDateQuery(deliveryDateFrom, deliveryDateTo);
        if (dateQuery) query.deliveryDate = dateQuery;

        const deliveries = await Delivery.find(query)
            .populate({ path: 'inventoryItem', populate: { path: 'uniform' } })
            .populate('deliveredBy', 'name');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Delivery Report');
        worksheet.columns = [
            { header: 'اسم الطالب', key: 'studentName', width: 25 },
            { header: 'المرحلة', key: 'stage', width: 15 },
            { header: 'الصف', key: 'grade', width: 10 },
            { header: 'الشعبة', key: 'section', width: 10 },
            { header: 'نوع الزي', key: 'uniformType', width: 15 },
            { header: 'المقاس', key: 'uniformSize', width: 10 },
            { header: 'الباركود', key: 'barcode', width: 30 },
            { header: 'تم التسليم بواسطة', key: 'deliveredBy', width: 20 },
            { header: 'تاريخ التسليم', key: 'deliveryDate', width: 22, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        ];
        deliveries.forEach(d => {
            worksheet.addRow({
                studentName: d.studentName,
                stage: d.stage,
                grade: d.grade,
                section: d.section,
                uniformType: d.inventoryItem?.uniform?.type,
                uniformSize: d.inventoryItem?.uniform?.size,
                barcode: d.inventoryItem?.barcode,
                deliveredBy: d.deliveredBy?.name,
                deliveryDate: d.deliveryDate,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="delivery_report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Delivery Report Export Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء تقرير التسليم.' });
    }
});

// --- Inventory Report Routes ---
const buildInventoryQuery = async (filters) => {
    const { stage, type, size, paymentType, entryDateFrom, entryDateTo } = filters;
    
    const uniformQuery = {};
    if (stage) uniformQuery.stage = stage;
    if (type) uniformQuery.type = type;
    if (size) uniformQuery.size = size;
    // إضافة فلتر نوع الدفع
    if (paymentType) uniformQuery.paymentType = paymentType;

    const uniformIds = await Uniform.find(uniformQuery).select('_id');
    const uniformIdArray = uniformIds.map(u => u._id);

    const inventoryQuery = { status: 'in_stock' };
    if (Object.keys(uniformQuery).length > 0) {
        inventoryQuery.uniform = { $in: uniformIdArray };
    }
    const dateQuery = buildDateQuery(entryDateFrom, entryDateTo);
    if (dateQuery) inventoryQuery.entryDate = dateQuery;
    
    return inventoryQuery;
};

router.post('/inventory-summary', async (req, res) => {
    try {
        const inventoryQuery = await buildInventoryQuery(req.body);
        
        const summary = await Inventory.aggregate([
            { $match: inventoryQuery },
            { $lookup: { from: 'uniforms', localField: 'uniform', foreignField: '_id', as: 'uniformDetails' }},
            { $unwind: '$uniformDetails' },
            // إضافة نوع الدفع إلى التجميع
            { $group: { _id: { stage: '$uniformDetails.stage', type: '$uniformDetails.type', size: '$uniformDetails.size', paymentType: '$uniformDetails.paymentType' }, quantity: { $sum: 1 }}},
            { $sort: { '_id.stage': 1, '_id.type': 1, '_id.size': 1, '_id.paymentType': 1 } }
        ]);

        res.json(summary);
    } catch (error) {
        console.error("Inventory Summary Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير الملخص.' });
    }
});

router.post('/inventory-details', async (req, res) => {
    try {
        const inventoryQuery = await buildInventoryQuery(req.body);
        const items = await Inventory.find(inventoryQuery).populate('uniform').sort({ entryDate: -1 });
        res.json(items);
    } catch (error) {
        console.error("Inventory Details Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير المفصل.' });
    }
});

router.post('/inventory-export', async (req, res) => {
    try {
        const inventoryQuery = await buildInventoryQuery(req.body);
        const items = await Inventory.find(inventoryQuery).populate('uniform').sort({ entryDate: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory Details');
        worksheet.columns = [
            { header: 'الباركود', key: 'barcode', width: 30 },
            { header: 'المرحلة', key: 'stage', width: 15 },
            { header: 'النوع', key: 'type', width: 15 },
            { header: 'المقاس', key: 'size', width: 10 },
            // إضافة عمود نوع الدفع
            { header: 'نوع الدفع', key: 'paymentType', width: 15 },
            { header: 'تاريخ الإدخال', key: 'entryDate', width: 22, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        ];
        items.forEach(item => {
            worksheet.addRow({
                barcode: item.barcode,
                stage: item.uniform?.stage,
                type: item.uniform?.type,
                size: item.uniform?.size,
                // إضافة بيانات نوع الدفع
                paymentType: item.uniform?.paymentType === 'paid' ? 'مدفوع' : 'مجاني',
                entryDate: item.entryDate,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_details_report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Inventory Export Error:", error);
        res.status(500).json({ message: 'فشل في تصدير تقرير المخزون.' });
    }
});
 
module.exports = router;
