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

/** @type {{[label: string]: TextEncoder;}} */
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

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
}

/**
 * @param {DragEvent} ev
 */
function fileDraggedIn(ev) {
    const fileItems = [...ev.dataTransfer.items].filter(
        item => item.kind === 'file'
    )

    if (fileItems.length == 0) {
        log.debug('no files dragged in', ev)
        return
    }

    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'copy'

    const hasTextFiles = fileItems.some(item => item.type.startsWith('text/'))

    if (hasTextFiles) {
        ev.dataTransfer.dropEffect = 'copy'
    }

    if (file) {
        displayDropZone()
    }
}

/**
 * @param {DragEvent} ev
 */
function overrideBrowserFileDraggingBehaviour(ev) {
    const fileItems = [...ev.dataTransfer.items].filter(
        item => item.kind === 'file'
    )

    if (fileItems.length == 0) {
        log.debug('no files being dragged', ev)
        return
    }

    ev.preventDefault()
}

/**
 * @param {DragEvent} ev
 */
function fileDraggedOut(ev) {
    const fileItems = [...ev.dataTransfer.items].filter(
        item => item.kind === 'file'
    )

    if (fileItems.length == 0) {
        log.debug('no files dragged out', ev)
        return
    }

    ev.preventDefault()

    if (file) {
        displayContents()
    }
}

/**
 * @param {DragEvent} ev
 */
function fileDropped(ev) {
    const fileItems = [...ev.dataTransfer.items].filter(
        item => item.kind === 'file'
    )

    if (fileItems.length == 0) {
        log.debug('no files dropped', ev)
        return
    }

    ev.preventDefault()

    log.debug('file dropped', ev)
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
 *
 * @return {TextDecoder}
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
