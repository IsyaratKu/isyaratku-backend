const fs = require('fs');
const path = require('path');

const bisindoSentencesPath = path.join(__dirname, '../../data/bisindo-sentences.json');

class BisindoService{
    constructor() {
        this.calculateBisindoScore = this.calculateBisindoScore.bind(this);
        this.loadBisindoSentences = this.loadBisindoSentences.bind(this);
        this.getBisindoRandomSentences = this.getBisindoRandomSentences.bind(this);
    }

    async calculateBisindoScore(sentence) {
        const WEIGHT_FACTOR = 1;
        const score = Math.floor(sentence.length * WEIGHT_FACTOR);
        return Math.max(1, Math.min(100, score));
    }

    async loadBisindoSentences() {
        const data = fs.readFileSync(bisindoSentencesPath, 'utf8');
        return JSON.parse(data).sentences;
    }

    async getBisindoRandomSentences(req, res) {
        try {
            const sentences = await this.loadBisindoSentences();
            const randomIndex = Math.floor(Math.random() * sentences.length);
            const sentence = sentences[randomIndex];
            const score = await this.calculateBisindoScore(sentence);
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

module.exports = new BisindoService();