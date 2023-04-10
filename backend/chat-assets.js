export function parseNotice(notice, accentColor) {

    let words = notice.split(' ');
    let data = [];

    words.forEach(checkWord => {

        // console.log(checkWord);

        // get the amount of flags in word
        let flags = checkWord.match(/%/g) ? checkWord.match(/%/g) : [];
        flags = flags.length;

        let wordData = {
            text: checkWord.substring(flags * 2),
            bold: false,
            underlined: false,
            color: '#FFFFFF',
        };

        // get first two chars of word
        for (let i = 0; i <= flags; i++) {
            switch (checkWord[i * 2 + 1]) {
                case 'S':
                    wordData.color = accentColor;
                    wordData.bold = true;
                    break;
                case 'B':
                    wordData.bold = true;
                    break;
                case 'U':
                    wordData.underlined = true;
                    break;
                case 'C':
                    wordData.color = accentColor;
                    break;
                default:
                    break;
            }
        }
        data.push(wordData);
    });
    return data;
}