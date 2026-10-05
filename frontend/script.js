const input = document.querySelector('#input');
const container = document.querySelector("#container");
const askButton = document.querySelector('#askButton');

input?.addEventListener('keydown',handleEnter);
askButton?.addEventListener('click',handleClickEvent)



function generateUserMsg(userMsg){
    const userMsgDiv = document.createElement('div');
    userMsgDiv.setAttribute('class',"my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit mx-4");
    userMsgDiv.innerText = `${userMsg}`;
    container.appendChild(userMsgDiv);
}

function generateAiReply(aiReply=`I'm good thanks for asking. What about you?`){
    const aiMsgDiv = document.createElement('div');
    aiMsgDiv.setAttribute('class','mr-auto max-w-fit mx-4');
    aiMsgDiv.innerText =`${aiReply}`;

    container?.appendChild(aiMsgDiv);
}


const Loading = document.createElement('div');
Loading.setAttribute('class','m-4 animate-pulse');
Loading.textContent = "Thinking... "

async function handleEnter(e){
    if(e.code === 'Enter' || e.key === 'Enter'){
        e.preventDefault(); 
        e.stopPropagation(); 
        askButton.disabled = true;
        const text = input?.value.trim();
        if(!text){
            return;
        }

        generateUserMsg(text);
        container.appendChild(Loading);
        await setTimeout(()=>{
            askButton.disabled = false;
        },200)

        input.value ="";
        await setTimeout(()=>{
            generateAiReply();
            Loading.remove()
        },2000)
    }
}

async function handleClickEvent(e){
    e.preventDefault();
    e.stopPropagation();
    askButton.disabled = true;
    askButton.innerText = "Wait ... "

    const text = input?.value.trim();
    if(text){
        
        generateUserMsg(text);
        input.value ="";
        generateAiReply();
        
        await setTimeout(()=>{
            askButton.disabled = false;
            askButton.innerText = "Ask"
        },200)
    }

}