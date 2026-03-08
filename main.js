/** @type {HTMLInputElement} */
let fileInput
/** @type {HTMLSelectElement} */
let encodingInput
/** @type {HTMLSpanElement} */
let errorSpan
/** @type {HTMLPreElement} */
let contentsElem
/** @type {HTMLLabelElement} */
let dropZone

/** @type {File?} */
let file

const log = console

/** @type {{[label: string]: TextDecoder;}} */
const textDecoders = {}

function main() {
    fileInput = document.getElementById('file')
    encodingInput = document.getElementById('encoding')
    errorSpan = document.getElementById('error')
    contentsElem = document.getElementById('contents')
    dropZone = document.getElementById('dropzone')

    fileInput.addEventListener('change', fileSelected)
    encodingInput.addEventListener('change', encodingChanged)

    window.addEventListener('dragenter', fileDraggedIn)
    window.addEventListener('dragover', overrideBrowserFileDraggingBehaviour)
    window.addEventListener('dragleave', fileDraggedOut)
    window.addEventListener('drop', fileDropped)
    contentsElem.addEventListener('dragover', overrideBrowserFileDraggingBehaviour)
    dropZone.addEventListener('dragover', overrideBrowserFileDraggingBehaviour)

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
}

/**
 * @param {DragEvent} ev
 */
function fileDraggedIn(ev) {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'copy'
}

/**
 * @param {DragEvent} ev
 */
function overrideBrowserFileDraggingBehaviour(ev) {
    ev.preventDefault()

    if (file) {
        displayDropZone()
    }
}

/**
 * @param {DragEvent} ev
 */
function fileDraggedOut(ev) {
    if (file) {
        displayContents()
    }
}

/**
 * @param {DragEvent} ev
 */
function fileDropped(ev) {
    ev.preventDefault()

    const fileItems = [...ev.dataTransfer.items].filter(
        item => item.kind === 'file'
    )

    if (fileItems.length == 0) {
        return
    }

    // use only the first text file and ignore the rest
    log.debug('dropped', fileItems.length, 'text files')
    file = fileItems[0].getAsFile()
    renderTextContents()
}

function handleUnhandledRejection(err) {
    log.error(err)
    setError(err.message || 'Unknown error')
}

function encodingChanged() {
    if (file) {
        renderTextContents()
    }
}

function fileSelected() {
    file = fileInput.files.item(0)
    renderTextContents()
}

function displayContents() {
    requestAnimationFrame(function () {
        dropZone.classList.add('hidden')
        contentsElem.classList.remove('hidden')
    })
}

function displayDropZone() {
    requestAnimationFrame(function () {
        dropZone.classList.remove('hidden')
        contentsElem.classList.add('hidden')
    })
}

function renderTextContents() {
    setError('')
    displayContents()
    decodeFile()
}

async function decodeFile() {
    const stream = file.stream()
    const label = encodingInput.value
    const decoder = textDecoder(label)
    const reader = stream.getReader()
    contentsElem.textContent = ''

    let next = true
    while (next) {
        const {done, value} = await reader.read()
        contentsElem.textContent += decoder.decode(value)
        next = done
    }
}

/**
 * @param {string} label
 */
function textDecoder(label) {
    let decoder = textDecoders[label]
    
    if (!decoder) {
        decoder = new TextDecoder(label)
        textDecoders[label] = decoder
    }

    return decoder
}

/**
 * @param {string} msg
 */
function setError(msg) {
    requestAnimationFrame(function () {
        errorSpan.textContent = msg
    })
}

document.addEventListener('DOMContentLoaded', main)
