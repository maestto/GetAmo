const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

const app = express();
const port = 3000;

app.use(bodyParser.json());

dotenv.config();
const subdomain = process.env.SUBDOMAIN;
const apiKey = process.env.API_KEY;

app.get('/create-contact-and-deal', async (req, res) => {
    const { name, email, phone } = req.query;

    try {
        const contact = await findContactByEmailOrPhone(email, phone);

        if (contact) {
            await updateContact(contact.id, { name, email, phone });
            await createDeal(contact.id);
        } else {
            const newContact = await createContact({ name, email, phone });
            await createDeal(newContact.id);
        }

        res.status(200).json({ message: 'Операция выполнена успешно' });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ message: 'Ошибка при выполнении операции' });
    }
});

async function findContactByEmailOrPhone(email, phone) {
    const apiUrlPhone = `https://${subdomain}.amocrm.ru/api/v4/contacts?query=${phone}`;
    const apiUrlEmail = `https://${subdomain}.amocrm.ru/api/v4/contacts?query=${email}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    try {
        const responsePhone = await axios.get(apiUrlPhone, { headers });
        if (responsePhone.data && responsePhone.data._embedded.contacts.length > 0) {
            return responsePhone.data._embedded.contacts[0];
        }

        const responseEmail = await axios.get(apiUrlEmail, { headers });
        if (responseEmail.data && responseEmail.data._embedded.contacts.length > 0) {
            return responseEmail.data._embedded.contacts[0];
        }

        return false;
    } catch (error) {
        console.error('Ошибка при поиске контакта:', error.message);
        return false;
    }
}

async function createContact(contactData) {
    const apiUrl = `https://${subdomain}.amocrm.ru/api/v4/contacts`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    try {
        const response = await axios.post(apiUrl, contactData, { headers });

        if (response.status === 200) {
            console.log('Контакт успешно создан:', response.data);
            return response.data;
        } else {
            console.error('Ошибка при создании контакта:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Ошибка при создании контакта:', error.message);
        return null;
    }
}

async function updateContact(contactId, contactData) {
    console.log(contactData)
    const apiUrl = `https://${subdomain}.amocrm.ru/api/v4/contacts/${contactId}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    try {
        const response = await axios.patch(apiUrl, contactData, { headers });

        if (response.status === 200) {
            console.log('Контакт успешно обновлен:', response.data);
            return response.data;
        } else {
            console.error('Ошибка при обновлении контакта:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Ошибка при обновлении контакта:', error.message);
        return null;
    }
}

async function createDeal(contactId) {
    const apiUrl = `https://${subdomain}.amocrm.ru/api/v4/leads`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    const dealData = {
        contacts: [{ id: contactId }],
    };

    try {
        const response = await axios.post(apiUrl, dealData, { headers });

        if (response.status === 200) {
            console.log('Сделка успешно создана:', response.data);
            return response.data;
        } else {
            console.error('Ошибка при создании сделки:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Ошибка при создании сделки:', error.message);
        return null;
    }
}

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
