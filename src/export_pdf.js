// static link to the template pdf file
const pdfTemplate = 'pdf/PDF_result_template.pdf';
const pdfFont = 'pdf/FRABK.TTF';


// page height (a4): 11.69 inch
// units in pdf-lib: 1/72 inch
// -> total page height: 841.68

// page height in Illustrator (mm): 297
// 297 * x = 841.89
// x = 841.89 / 297 = 2.83

// Formula to convert from Illustrator position to pdf-lib units:
// (297 - illustrator_pos) * 2.83
const pdfAnswerFormat = {

    "q0": {
        "x": 58.9,
        "y": 620,
        "page": 0,
    },


    "q1": {
        "x": 58.9,
        "y": 409,
        "page": 0,
        
    },


    "q2": {
        "x": 58.9,
        "y": 185,
        "page": 0,
    },


    "q3": {
        "x": 58.9,
        "y": 688,
        "page": 1,
       
    },



    "q4": {
        "x": 58.9,
        "y": 454,
        "page": 1,
    },


    "q5": {
        "x": 58.9,
        "y": 200,
        "maxWidth": 480,
        "page": 1,
    },


    "q6": {
        "x": 90,
        "y": 700,
        "page": 2,
        "isLikard" : true,
    },


    "q7": {
        "x": 90,
        "y": 530,
        "page": 2,
        "isLikard" : true,
    },


    "q8": {
        "x": 90,
        "y": 380,
        "page": 2,
        "isLikard" : true,
    },


    "q9": {
        "isMixed": true,
        "x": 58.9,
        "y": 240,
        "x2": 58.9,
        "y2": 185,
        "maxWidth": 480,
        "page": 2,
    },


    "q10": {
        "x": 58.9,
        "y": 665,
        "maxWidth": 480,
        "page": 3,
    },

    "q11": {
     
        "x": 58.9,
        "y": 429,
       
        "maxWidth": 480,
        "page": 3,
    },

   

    "q12": {
        "x": 58.9,
        "y": 175,
        "maxWidth": 480,
        "page": 3,
    },
   
  
  
    "q13": {
        "x": 58.9,
        "y": 665,
        "maxWidth": 480,
        "page": 4,
    },
    
  
}

const likardGapSize = 121.1;


/**
 * Creates a duplicate of the template pdf with the current answers and downloads it
 */
async function exportPDF(questionAnswers) {
    // open pdf template file, defined in index.html
    const pdfData = await fetch(pdfTemplate).then(file => file.arrayBuffer());
    //const pdfData = await pdfData.arrayBuffer();

    const pdf = await PDFLib.PDFDocument.load(pdfData);
    const pages = pdf.getPages();

    // load the correct font
    pdf.registerFontkit(fontkit);
    const fontData = await fetch(pdfFont).then(file => file.arrayBuffer());
    const font = await pdf.embedFont(fontData, { subset: true });

    for (const [key, value] of Object.entries(questionAnswers)) {
        if (key == "result") continue;

        if (pdfAnswerFormat[key]["isLikard"]) {
            // create a point at the correct position
            const answerIndex = parseInt(value.replace("a", ""));

            pages[pdfAnswerFormat[key]["page"]].drawCircle({
                x: pdfAnswerFormat[key]["x"] + (likardGapSize * answerIndex),
                y: pdfAnswerFormat[key]["y"],
                size: 15,
                color: PDFLib.rgb(0.9137, 0.2549, 0.5647),
                borderWidth: 1,
                borderColor: PDFLib.rgb(0.1020, 0.1804, 0.2667),
            });
        } else if (pdfAnswerFormat[key]["isMixed"]) {
            // write both the multiple choice and the text answer in their respective positions
            const answerA = value.split(":::")[0];
            const answerB = value.replace(value.split(":::")[0] + ":::", "");

            const textA = getAnswerText(key, answerA);
            const textB = getAnswerText(key, answerB);

            pages[pdfAnswerFormat[key]["page"]].drawText(textA, {
                x: pdfAnswerFormat[key]["x"],
                y: pdfAnswerFormat[key]["y"],
                font: font,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
            pages[pdfAnswerFormat[key]["page"]].drawText(textB, {
                x: pdfAnswerFormat[key]["x2"],
                y: pdfAnswerFormat[key]["y2"],
                font: font,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
        } else if (pdfAnswerFormat[key]["isMulti"]) {
            // write the text of all selected answers into the text field
            const selectedAnswers = value.split(',');
            const answerTexts = [];
            selectedAnswers.forEach(answer => {
                answerTexts.push(getAnswerText(key, answer));
            });

            let answerText = "";
            answerTexts.forEach(text => answerText += text + ', ');
            answerText = answerText.slice(0, -2);

            pages[pdfAnswerFormat[key]["page"]].drawText(answerText, {
                x: pdfAnswerFormat[key]["x"],
                y: pdfAnswerFormat[key]["y"],
                font: font,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
        } else {
            // create a new text field and add it to a page
            const text = getAnswerText(key, value);

            pages[pdfAnswerFormat[key]["page"]].drawText(text, {
                x: pdfAnswerFormat[key]["x"],
                y: pdfAnswerFormat[key]["y"],
                font: font,
                color: PDFLib.rgb(0.1294, 0.1216, 0.1216),
                size: 14,
                lineHeight: 20,
                maxWidth: pdfAnswerFormat[key]["maxWidth"],
                opacity: 1,
            });
        }
    }

    // save the pdf into a new file
    const newPdfData = await pdf.save();

    downloadFile('medienfuererschein_ki_ergebnis.pdf', newPdfData);
}


/**
 * Get the content of the specified answer - it's text
 * @param {string} question the code of the desired question e.g. 'q1'
 * @param {string} answer the code of the desired answer e.g. 'a0'
 */
function getAnswerText(question, answer) {
    const elementID = question + "_" + answer;

    const element = document.getElementById(elementID);

    if (element) {
        for (const child of element.children) {
            if (child.innerText != "") {
                return child.innerText;
            }
        }
    } else {
        return answer;
    }
}


/**
 * Download the given data as new pdf file with the given name
 * @param {string} filename the name of the file that will be downloaded
 * @param {object} data the pdf data as Uint8Array
 */
function downloadFile(filename, data) {
    // make sure the filename has the ".pdf" extension
    if (filename.split(".").at(-1) != "pdf") {
        filename += ".pdf";
    }

    // create dummy element holding the data as URL
    const dummy = document.createElement('a');
    dummy.href = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
    dummy.download = filename;

    // add the dummy to the document and click it to trigger the download
    document.body.appendChild(dummy);
    dummy.click();
    document.body.removeChild(dummy);
}
