const express = require('express');
const router = express.Router();
const { excelLost } = require('../middleware/lost.middleware');
const Lost = require('../models/Lost');


router.post('/addExcelLost', excelLost );

// Роут для получения всех трек-кодов с пагинацией, поисковым запросом и сортировкой
router.get('/losts', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 400;
    const searchQuery = req.query.search || ''; // Получение поискового запроса из параметров запроса
    const sortByDate = req.query.sortByDate || 'latest'; // Получение типа сортировки из параметров запроса

    try {
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let query = {}; // Пустой объект запроса, который будет использоваться для фильтрации

        // Если есть поисковый запрос, добавляем его в запрос
        if (searchQuery) {
            query.$or = [
            { track: { $regex: new RegExp(searchQuery, 'i') } },
            { user: { $regex: new RegExp(searchQuery, 'i') } }
        ];
        }
      
        // Устанавливаем параметры сортировки в зависимости от выбранного типа
        let sortOptions = {};
        if (sortByDate === 'latest') {
            sortOptions = { 'history.date': 'desc' }; // Сортировка по последней дате в истории
        } else if (sortByDate === 'oldest') {
            sortOptions = { 'history.date': 'asc' }; // Сортировка по первой дате в истории
        }

        const tracks = await Lost.find(query) // Используем query для фильтрации
            .sort(sortOptions) // Применяем параметры сортировки
            .limit(limit)
            .skip(startIndex);

        const totalCount = await Lost.countDocuments(query); // Также учитываем query при подсчете общего количества документов

        const response = {
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            tracks
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
