const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão
mongoose.connect('mongodb://127.0.0.1:27017/cadastro_municipios')
    .then(() => console.log("✅ Conectado ao MongoDB"))
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// No seu server.js
const Municipio = mongoose.model('Municipio', {
    nome: String,
    estado: String,
    populacao: Number,
    area_km2: Number,
    idhm: Number,
    prefeito: String,   // Nome igual ao JSON
    cod_ibge: Number,   // Nome igual ao JSON
    capital: Boolean
});

// Rota para BUSCAR (GET)
app.get('/municipios', async (req, res) => {
    try {
        const lista = await Municipio.find();
        res.json(lista);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar municípios" });
    }
});

// Rota para SALVAR (POST)
app.post('/cadastrar', async (req, res) => {
    try {
        const novo = new Municipio(req.body);
        await novo.save();
        res.status(201).json({ mensagem: "Sucesso!" });
    } catch (error) {
        res.status(400).json({ erro: "Erro ao cadastrar município" });
    }
});

// Rota para ATUALIZAR (PUT)
app.put('/municipios/:id', async (req, res) => {
    try {
        await Municipio.findByIdAndUpdate(req.params.id, req.body);
        res.json({ mensagem: "Atualizado com sucesso!" });
    } catch (error) {
        res.status(400).json({ erro: "Erro ao atualizar município" });
    }
});

// Rota para EXCLUIR (DELETE)
app.delete('/municipios/:id', async (req, res) => {
    try {
        await Municipio.findByIdAndDelete(req.params.id);
        res.json({ mensagem: "Excluído com sucesso!" });
    } catch (error) {
        res.status(400).json({ erro: "Erro ao excluir município" });
    }
});

app.listen(3000, () => console.log("🚀 Servidor rodando!"));