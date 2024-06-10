const fs = require('fs');
const path = require('path');

const aslIndoSentencesPath = path.join(__dirname, '../../data/asl-indo-sentences.json');
const aslEngSentencesPath = path.join(__dirname, '../../data/asl-eng-sentences.json');

class ASLService{
    constructor() {
        this.calculateASLScore = this.calculateASLScore.bind(this);
        this.loadASLSentences = this.loadASLSentences.bind(this);
        this.loadAllASLSentences = this.loadAllASLSentences.bind(this);
        this.getASLRandomSentences = this.getASLRandomSentences.bind(this);
    }

    async calculateASLScore(sentence) {
        const WEIGHT_FACTOR = 1;
        const score = Math.floor(sentence.length * WEIGHT_FACTOR);
        return Math.max(1, Math.min(100, score));
    }

    async loadASLSentences(filePath) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data).sentences;
    }

    async loadAllASLSentences() {
        const indoSentences = await this.loadASLSentences(aslIndoSentencesPath);
        const engSentences = await this.loadASLSentences(aslEngSentencesPath);
        return [...indoSentences, ...engSentences];
    }

    async getASLRandomSentences(req, res) {
        try {
            const sentences = await this.loadAllASLSentences();
            const randomIndex = Math.floor(Math.random() * sentences.length);
            const sentence = sentences[randomIndex];
            const score = await this.calculateASLScore(sentence);
            return res.status(200).json({
                sentence,
                score
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                message: 'Internal server error',
            });
        }
    }
}

module.exports = new ASLService();