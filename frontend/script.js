const input = document.querySelector('#input');
const container = document.querySelector('#container');
const askButton = document.querySelector('#askButton');
const askButtonLabel = askButton?.textContent?.trim() || 'Ask';
let isSubmitting = false;

input?.addEventListener('keydown', handleEnter);
askButton?.addEventListener('click', handleClickEvent);

function setAskButtonLoading(isLoading) {
    if (!askButton) {
        return;
    }

    askButton.disabled = isLoading;
    if (isLoading) {
        const spinner = document.createElement('span');
        spinner.setAttribute('class', 'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent');
        spinner.setAttribute('aria-hidden', 'true');

        const loadingLabel = document.createElement('span');
        loadingLabel.setAttribute('class', 'sr-only');
        loadingLabel.textContent = 'Loading';
       

        askButton.setAttribute('aria-busy', 'true');
        askButton.replaceChildren(spinner, loadingLabel);
        return;
    }

    askButton.removeAttribute('aria-busy');
    askButton.textContent = askButtonLabel;
}

function generateUserMsg(userMsg) {
    const userMsgDiv = document.createElement('div');
    userMsgDiv.setAttribute('class', 'my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit mx-4');
    userMsgDiv.innerText = `${userMsg}`;
    container?.appendChild(userMsgDiv);
    scrollMessageAboveComposer(userMsgDiv);
}

function scrollMessageAboveComposer(message) {
    const composer = input?.closest('.fixed');
    const composerHeight = composer?.getBoundingClientRect().height ?? 0;
    const gap = 16;
    const visibleBottom = window.innerHeight - composerHeight - gap;
    const messageBottom = message.getBoundingClientRect().bottom;
    const scrollOffset = messageBottom - visibleBottom;

    window.scrollTo({
        top: window.scrollY + scrollOffset,
        behavior: 'smooth'
    });
}

function generateAiReply(aiReply = 'hello') {
    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.setAttribute('class', 'mr-auto my-4 mx-4 max-w-3xl rounded-xl  p-4 leading-7 break-words');
    renderMarkdown(aiMsgDiv, aiReply);

    container?.appendChild(aiMsgDiv);
    scrollMessageAboveComposer(aiMsgDiv);
}

function appendInlineMarkdown(parent, text) {
    const inlinePattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;

    for (const match of text.matchAll(inlinePattern)) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));

        const token = match[0];
        let element;
        let content;

        if (token.startsWith('**') || token.startsWith('__')) {
            element = document.createElement('strong');
            content = token.slice(2, -2);
        } else if (token.startsWith('~~')) {
            element = document.createElement('del');
            content = token.slice(2, -2);
        } else if (token.startsWith('`')) {
            element = document.createElement('code');
            element.setAttribute('class', 'rounded bg-neutral-900 px-1 py-0.5 text-sm');
            content = token.slice(1, -1);
        } else {
            element = document.createElement('em');
            content = token.slice(1, -1);
        }

        element.textContent = content;
        parent.appendChild(element);
        lastIndex = match.index + token.length;
    }

    parent.appendChild(document.createTextNode(text.slice(lastIndex)));
}

function renderMarkdown(parent, markdown) {
    const lines = markdown.split(/\r?\n/);
    let index = 0;

    while (index < lines.length) {
        const rawLine = lines[index];
        const line = rawLine.trim();
        if (!line) {
            index += 1;
            continue;
        }

        const codeFenceMatch = line.match(/^```([\w+-]*)\s*$/);
        if (codeFenceMatch) {
            const codeLines = [];
            index += 1;

            while (index < lines.length && !lines[index].trim().startsWith('```')) {
                codeLines.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) {
                index += 1;
            }

            const codeBlock = document.createElement('div');
            codeBlock.setAttribute('class', 'my-3 w-full max-w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950');

            if (codeFenceMatch[1]) {
                const languageLabel = document.createElement('div');
                languageLabel.setAttribute('class', 'border-b border-neutral-700 px-4 py-2 text-xs text-neutral-400');
                languageLabel.textContent = codeFenceMatch[1];
                codeBlock.appendChild(languageLabel);
            }

            const pre = document.createElement('pre');
            pre.setAttribute('class', 'overflow-x-auto p-4 text-sm leading-6');
            const code = document.createElement('code');
            code.setAttribute('class', 'font-mono whitespace-pre');
            code.textContent = codeLines.join('\n');
            pre.appendChild(code);
            codeBlock.appendChild(pre);
            parent.appendChild(codeBlock);
            continue;
        }

        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            const heading = document.createElement(`h${headingMatch[1].length}`);
            heading.setAttribute('class', 'mb-2 mt-3 font-semibold');
            appendInlineMarkdown(heading, headingMatch[2]);
            parent.appendChild(heading);
            index += 1;
            continue;
        }

        const listMatch = line.match(/^([-*]|\d+\.)\s+(.+)$/);
        if (listMatch) {
            const isOrdered = /^\d+\./.test(listMatch[1]);
            const list = document.createElement(isOrdered ? 'ol' : 'ul');
            list.setAttribute('class', `${isOrdered ? 'list-decimal' : 'list-disc'} my-2 space-y-1 pl-6`);

            while (index < lines.length) {
                const itemMatch = lines[index].trim().match(/^([-*]|\d+\.)\s+(.+)$/);
                if (!itemMatch || /^\d+\./.test(itemMatch[1]) !== isOrdered) {
                    break;
                }

                const item = document.createElement('li');
                appendInlineMarkdown(item, itemMatch[2]);
                list.appendChild(item);
                index += 1;
            }

            parent.appendChild(list);
            continue;
        }

        const paragraph = document.createElement('p');
        paragraph.setAttribute('class', 'my-2');
        appendInlineMarkdown(paragraph, rawLine);
        parent.appendChild(paragraph);
        index += 1;
    }
}

function generateError(errorMessage) {
    const errorMsgDiv = document.createElement('div');
    errorMsgDiv.setAttribute('class', 'm-6 mx-4 p-3 max-w-fit  bg-red-950 border border-red-800 rounded-xl leading-normal break-words');
    errorMsgDiv.setAttribute('role', 'alert');
    errorMsgDiv.textContent = `Error : ${errorMessage}`;

    container?.appendChild(errorMsgDiv);
}

const Loading = document.createElement('div');
Loading.setAttribute('class', 'm-4 animate-pulse');
Loading.textContent = 'Thinking... ';

async function handleEnter(e) {
    if (e.key !== 'Enter') {
        return;
    }

    e.preventDefault();
    e.stopPropagation();
    await submitMessage();
}

async function handleClickEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    await submitMessage();
}

async function submitMessage() {
    if (isSubmitting) {
        return;
    }

    isSubmitting = true;
    setAskButtonLoading(true);

    try {
        const text = input?.value.trim();
        if (!text) {
            throw new Error('Please Send Some text to LLM');
        }

        generateUserMsg(text);
        container?.appendChild(Loading);
        scrollMessageAboveComposer(Loading);
        
        if (input) {
            input.value = '';
        }

        await apiCaller(text);
    } catch (error) {
        generateError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
        isSubmitting = false;
        setAskButtonLoading(false);
        Loading.remove();
    }
}

async function apiCaller(userMsg) {
    const response = await fetch('http://localhost:3000/api/v1/chats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userMessage: userMsg
        })
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('The server returned an invalid response.');
    }

    if (typeof data?.aiResponse !== 'string') {
        throw new Error('The server response did not contain a valid AI reply.');
    }

    generateAiReply(data.aiResponse);
}
