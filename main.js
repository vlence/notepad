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
/** @type {HTMLButtonElement} */
let saveBtn

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
    saveBtn = document.getElementById('save')

    saveBtn.addEventListener('click', saveFile)

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

function saveFile() {
    const a = document.createElement('a')
    const blob = new Blob([contentsElem.textContent], {type: file.type})
    const url = URL.createObjectURL(blob)

    a.href = url
    a.download = file.name
    a.classList.add('hidden')

    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
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
function fileDraggedOut() {
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
    requestAnimationFrame(() => saveBtn.disabled = false)
}

async function decodeFile() {
    const stream = file.stream()
    const label = encodingInput.value
    const decoder = textDecoder(label)
    const reader = stream.getReader()
    contentsElem.textContent = ''


    const kib = 1024
    const page = 3 * kib
    while (true) {
        let {done, value} = await reader.read()

        if (done) {
            break
        }

        do {
            let slice = value

            if (slice.byteLength > page) {
                slice = value.subarray(0, page)
            }

            value = value.subarray(slice.byteLength)
            const textNode = document.createTextNode(decoder.decode(slice))

            // contentsElem.textContent += decoder.decode(slice)
            requestAnimationFrame(() => {
                contentsElem.appendChild(textNode)
            })
        }
        while(value.byteLength > 0)
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
