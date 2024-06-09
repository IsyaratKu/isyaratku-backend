const fs = require('fs');
const path = require('path');

const calculateASLScore = (sentence) => {
    const WEIGHT_FACTOR = 1;
    const score = Math.floor(sentence.length * WEIGHT_FACTOR);
    return Math.max(1, Math.min(100, score));
};

const aslIndoSentencesPath = path.join(__dirname, '../../data/asl-indo-sentences.json');
const aslEngSentencesPath = path.join(__dirname, '../../data/asl-eng-sentences.json');

const loadASLSentences = (filePath) => {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).sentences;
};

const loadAllASLSentences = () => {
    const indoSentences = loadASLSentences(aslIndoSentencesPath);
    const engSentences = loadASLSentences(aslEngSentencesPath);
    return [...indoSentences, ...engSentences];
    
};

const getASLRandomSentences = (req, res) => {
    try {
        const sentences = loadAllASLSentences();
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const sentence = sentences[randomIndex];
        const score = calculateASLScore(sentence);
        return res.status(200).json({
            sentence,
            score
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

module.exports = {
    getASLRandomSentences
};
