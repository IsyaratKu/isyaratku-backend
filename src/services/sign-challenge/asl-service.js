const fs = require('fs');
const path = require('path');

const aslSentencesPath = path.join(__dirname, '../../data/asl-sentences.json');

const loadASLSentences = () => {
    const data = fs.readFileSync(aslSentencesPath, 'utf8');
    return JSON.parse(data).sentences;
};

const getASLRandomSentences = (req, res) => {
    try{
        const sentences = loadASLSentences();
        const randomIndex = Math.floor(Math.random() * sentences.length);
        const sentence = sentences[randomIndex];
        return res.status(200).json({
            sentence,
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