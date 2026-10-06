# InCity - планировщик маршрута для Т-Путешествий

> Курсовая работа, 2 курс ФКН ПИ  
> **Демо**: [http://31.56.222.201](http://31.56.222.201)

## Содержание

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Установка и запуск](#установка-и-запуск)



## О проекте

**InCity** — веб-приложение для построения оптимальных туристических маршрутов по городу. Пользователь выбирает начальную точку, желаемые для посещения категории достопримечательностей и событий, предпочтительные виды транспорта, а система автоматически строит оптимальный маршрут с учётом времени работы мест, пеших переходов и общественного транспорта.

### Ключевые особенности
- **Качество данных** - маршруты строятся на основе реальных данных OpenStreetMap
- **Общественный транспорт** - поддержка метро, автобусов, трамваев, троллейбусов и пеших переходов
- **Цветовая дифференциация** - линии метро отображаются в цветах реальных веток
- **Интерактивная карта** - визуализация маршрута с выделением секций и сегментов
- **Детальная информация** - карточки достопримечательностей с фото и описаниями


## Возможности

### Карта и навигация
- Отображение маршрута на интерактивной карте Leaflet
- Цветовое кодирование линий метро по реальным веткам
- Двойные линии для наземного транспорта (автобусы, трамваи, троллейбусы)
- Направленные стрелки движения
- Кластеризация достопримечательностей при малом зуме
- Автоматическое зумирование к выбранной секции маршрута

### Транспорт
- Поддержка метро
- Наземный транспорт: автобусы, трамваи, троллейбусы
- Пешие переходы между остановками и достопримечательностями
- Визуализация остановок с информацией о транспорте

### Достопримечательности
- Категоризация по типам (музеи, театры, парки, памятники и др.)
- Фотографии и описания из Wikipedia
- Время работы и контактная информация
- Расчёт времени на осмотр

### Интерфейс
- Адаптивный дизайн для мобильных устройств
- Информационная панель с возможностью сворачивания
- Переключение между маршрутом и списком достопримечательностей
- Выделение секций маршрута с фильтрацией на карте


## Установка и запуск

Для локального запуска выполниь: 

1. Склонировать репозиторий

```bash
git clone <путь>
```

2. Перейти в папку бэкенда и запустить докер

```bash
cd backend
docker compose up --build
```

3. Перейти в папку фронтенда

```bash
cd frontend
npm install
npm run dev 
```

## Демонстрация интерфейса
<img width="533" height="300" alt="image" src="https://github.com/user-attachments/assets/04371583-b4b8-4966-b9ef-a440f70e45c5" />

<img width="704" height="227" alt="image" src="https://github.com/user-attachments/assets/3b1b6299-cd41-4cea-afb8-b78910ca97f9" />

<img width="533" height="300" alt="image" src="https://github.com/user-attachments/assets/0b18d7b3-1bd4-48b7-96cf-a3d13b0198f1" />

<img width="533" height="300" alt="image" src="https://github.com/user-attachments/assets/2f222b7e-974b-40ac-ae2f-4393a9ffc6f8" />

<img width="529" height="302" alt="image" src="https://github.com/user-attachments/assets/44cd681f-3052-4bd1-b2c0-dabd19e914a9" />


<img width="462" height="347" alt="image" src="https://github.com/user-attachments/assets/9abe081a-cd0d-4416-aec2-8ade004a03b0" />

<img width="445" height="360" alt="image" src="https://github.com/user-attachments/assets/bc44fabb-6db7-49ef-afc9-235543445ddf" />

<img width="315" height="508" alt="image" src="https://github.com/user-attachments/assets/75e5c177-3330-40b9-8bb0-43b463d1b844" />

<img width="496" height="323" alt="image" src="https://github.com/user-attachments/assets/b706928b-9f91-47b5-ae3f-41aead5f3011" />


<img width="534" height="300" alt="image" src="https://github.com/user-attachments/assets/e4f78e51-800d-4d83-8da5-6049b6fd712a" />


<img width="602" height="266" alt="image" src="https://github.com/user-attachments/assets/b21d2c2a-36f3-45bc-8c13-34a3b78d3909" />

<img width="406" height="393" alt="image" src="https://github.com/user-attachments/assets/ab14dd1c-6166-4c79-8af3-93ed46e5271f" />



<img width="567" height="282" alt="image" src="https://github.com/user-attachments/assets/b005ec90-cbee-4efe-8ed4-ed1e462e5200" />

<img width="476" height="336" alt="image" src="https://github.com/user-attachments/assets/7663cdd8-87b2-49c1-8eb4-967041195bba" />

<img width="517" height="309" alt="image" src="https://github.com/user-attachments/assets/aab1cb88-bfbc-4a0d-994a-4417c4c75b06" />

<img width="527" height="303" alt="image" src="https://github.com/user-attachments/assets/7cbf1d4f-1e70-48f1-b577-9c566fbdc023" />

<img width="681" height="235" alt="image" src="https://github.com/user-attachments/assets/b9cd1330-a05d-4889-b54f-7a217c89f03e" />


<img width="337" height="475" alt="image" src="https://github.com/user-attachments/assets/cd9f7785-299d-40db-b974-6d4b790dd3a0" />

<img width="540" height="296" alt="image" src="https://github.com/user-attachments/assets/86ed4bf2-a7cf-4bc9-8a6a-a30b7d7b87f5" />

<img width="529" height="302" alt="image" src="https://github.com/user-attachments/assets/fd320a5f-2ba7-4386-8fed-a30f52d1186a" />

<img width="528" height="303" alt="image" src="https://github.com/user-attachments/assets/a83a7c93-9be0-4844-92e5-a26cbe6fd2f8" />


<img width="1001" height="160" alt="image" src="https://github.com/user-attachments/assets/2a97a1c3-76b6-4ac4-8cba-e8b463e8c29b" />

<img width="423" height="378" alt="image" src="https://github.com/user-attachments/assets/ff7fedaa-a30f-4e8d-82d4-a955e81e0361" />

<img width="268" height="598" alt="image" src="https://github.com/user-attachments/assets/67458a4f-829a-458d-8c00-e28f30569f20" />

<img width="269" height="595" alt="image" src="https://github.com/user-attachments/assets/f5acbebc-5b26-4dba-a791-691c11ffdbe5" />

<img width="268" height="596" alt="image" src="https://github.com/user-attachments/assets/7912cdb8-222e-4327-bcf3-2903beab025c" />

<img width="268" height="596" alt="image" src="https://github.com/user-attachments/assets/9aa9ad3e-68d1-446b-90a9-ed4b889895a1" />

<img width="268" height="596" alt="image" src="https://github.com/user-attachments/assets/6d0c8559-7f71-4119-a301-013c311c764f" />

<img width="538" height="297" alt="image" src="https://github.com/user-attachments/assets/e60d196a-40a1-4eb9-bbcf-7432c315806f" />

<img width="269" height="594" alt="image" src="https://github.com/user-attachments/assets/cecf4c62-81d7-4430-aff0-59ea9ce0cf22" />

<img width="270" height="592" alt="image" src="https://github.com/user-attachments/assets/d26d7489-1667-4fe6-aecd-f860e030767d" />

<img width="699" height="229" alt="image" src="https://github.com/user-attachments/assets/c1227b78-cab3-48dd-bd5e-e618de0fd9a7" />

<img width="534" height="299" alt="image" src="https://github.com/user-attachments/assets/96868f6e-a877-43b1-a884-88158b6cffd6" />
