const header_elms = document.querySelectorAll('header .fade-opacity');
const header_bg = document.querySelector('.header-bg');
const header = document.querySelector('header');

let lastScrollTop = 0;

function fadeHeader() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop) {
        header_elms.forEach((item) => {item.style.opacity = '0';});
        header_bg.style.transform = 'translate(0,-100%)';
    }
    else {
        if (lastScrollTop > (window.innerHeight - header.offsetHeight))
            header_bg.style.transform = 'translate(0,0)';
        else
            header_bg.style.transform = 'translate(0,-100%)';
        
        header_elms.forEach((item) => {item.style.opacity = '1';});
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}

function shadowing(nodeList) {
    nodeList.forEach((item) => {item.classList.add('shadowed');});
}

const h2_articles = document.querySelectorAll('.inner-section article h2');
shadowing(h2_articles);

window.addEventListener('scroll', fadeHeader);

// ------------------------------------------------------ Chatbot -----------------------------------------------------
const assistant_url = "https://api.openai.com/v1/assistants";
const thread_url = "https://api.openai.com/v1/threads";
const assistant_tools = [
  {
    type: "function",
    function: {
      name: "getUpcomingLaunches",
      description: "Get the last three upcoming SpaceX launches"
    }
  }
];

const assistant_options = {
  name: "SpaceX Chatbot",
  model: "gpt-3.5-turbo",
  instructions: "You are an Assistant designed to act as a chatbot for the SpaceX website. Your purpose is to provide users with information about SpaceX, its missions, rockets, launches, and any other relevant details they may ask for, with the help of the provided functions only if needed. Provide clear and concise responses, ensuring accuracy and relevance in all answers, while engaging users in friendly and natural conversation and maintaining context throughout the interaction.",
  tools: assistant_tools
};

let assistant_obj;
let thread_obj;

// -------------------------------------------------- GUI --------------------------------------------------------
function openChat() {
    const chatbot_section = document.querySelector("#chatbot");
    const header = document.querySelector("header");
    const body = document.querySelector("body");

    body.classList.add("overflow-hidden");
    chatbot_section.style.display = "flex";
    setTimeout(() => {
        chatbot_section.style.opacity = "1";  
    }, 100);
    header.classList.add("hidden");

    document.querySelector("#chatbot-btn").addEventListener("click", closeChat);
    document.querySelector("#chatbot-btn").removeEventListener("click", openChat);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeChat();
      }
    });
}

function closeChat() {
    const chatbot_section = document.querySelector("#chatbot");
    const header = document.querySelector("header");
    const body = document.querySelector("body");

    body.classList.remove("overflow-hidden");

    chatbot_section.style.opacity = "0";
    setTimeout(() => {
        chatbot_section.style.display = "none"; 
    }, 400);
    header.classList.remove("hidden");
    
    document.querySelector("#chatbot-btn").addEventListener("click", openChat);
    document.querySelector("#chatbot-btn").removeEventListener("click", closeChat);
}

function sendToBox(message) {
    const chatbox = document.querySelector('#chat-box');
    const message_element = document.createElement('div');
    const message_container = document.createElement('div');
    const message_creator = document.createElement('div');

    if (message.role !== "user" && message.role !== "assistant")
      return

    message_creator.innerText = message.role === "user" ? "You" : "Chatbot";
    message_creator.classList.add(`message-creator-${message.role}`);
    message_container.classList.add(`${message.role}-message-container`);
    message_element.classList.add(`${message.role}-message`);

    message_container.appendChild(message_creator);
    message_container.appendChild(message_element);   
    message_element.innerText = message.content[0].text.value;
    chatbox.appendChild(message_container);
}


//----------------------------------------------------------------------------------------------------------------------------

async function fetchAPIKey() {
  try {
    const response = await fetch(".config.json");
    const data = await response.json();

    return data.api_key;
  } catch (error) { throw error; }
}

async function createAssistant(body_values) {
  const API_KEY = await fetchAPIKey();
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify(body_values)
  };

  try {
    const response = await fetch(assistant_url, options);
    const assistant = await response.json();
    console.log(assistant);
    
    return assistant;
  } catch (error) { throw error; }
}

async function createThread() {
  const API_KEY = await fetchAPIKey();
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  };

  try {
    const response = await fetch(thread_url, options);
    const thread = await response.json();
    console.log(thread);

    return thread;
  } catch (error) { throw error; }
}

async function retrieveThread(thread_id) {
  const API_KEY = await fetchAPIKey();
  const url = `${thread_url}/${thread_id}`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  };

  try {
    const response = await fetch(url, options);
    const thread = await response.json();

    return thread;
  } catch (error) {throw error;}
}

async function listAssistants() {
  const API_KEY = await fetchAPIKey();
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  };

  try {
    const response = await fetch(assistant_url, options);
    const list = await response.json();

    return list;
  } catch (error) { throw error };
}

async function searchAssistantByName(assistant_name) {
  const assistant_list = await listAssistants();
  const assistant = assistant_list.data.find((assist) => assist.name === assistant_name);

  return assistant;
}

async function modifyAssistant(assistant_id, assistant_opt) {
  const API_KEY = await fetchAPIKey();
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"      
    },
    body: JSON.stringify(assistant_opt)
  };

  try {
    const response = await fetch(`${assistant_url}/${assistant_id}`, options);
    const modified_assistant = await response.json();

    return modified_assistant;
  } catch (error) {throw error;}
}

async function createMessage(thread_id, prompt) {
  const API_KEY = await fetchAPIKey();
  const message_url = `https://api.openai.com/v1/threads/${thread_id}/messages`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      role: "user",
      content: prompt
    })
  };

  try {
    const response = await fetch(message_url, options);
    const message = await response.json();
    console.log(message);

    return message;
  } catch (error) { throw error; }
}

async function retrieveMessage(message_id, thread_id) {
  const API_KEY = await fetchAPIKey();
  const message_url = `https://api.openai.com/v1/threads/${thread_id}/messages/${message_id}`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  };

  try {
    const response = await fetch(message_url, options);
    const message = await response.json();

    return message;
  } catch (error) { throw error; }
}

async function listMessages(thread_id) {
  const API_KEY = await fetchAPIKey();
  const messages_url = `https://api.openai.com/v1/threads/${thread_id}/messages`;
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  };

  try {
    const response = await fetch(messages_url, options);
    const messages = await response.json();

    return messages;
  } catch (error) { throw error; }
}

async function retrieveLastMessage(thread_id) {
  const messages_list = await listMessages(thread_id);
  const last_message = messages_list.data[0];
  
  return last_message;
}

async function createRun(assist_id, thread_id) {
  const API_KEY = await fetchAPIKey();
  const run_url = `https://api.openai.com/v1/threads/${thread_id}/runs`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      assistant_id: assist_id
    })
  };

  try {
    const response = await fetch(run_url, options);
    const run = await response.json();
    console.log(run);
    
    return run;
  } catch (error) { throw error; }

}

async function cancelRun(run) {
  const API_KEY = await fetchAPIKey();
  const url = `https://api.openai.com/v1/threads/${run.thread_id}/runs/${run.id}/cancel`;
  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  }

  try {
    await fetch(url, options);
  } catch (error) {throw error;}
}

async function retrieveRun(thread_id, run_id) {
  const API_KEY = await fetchAPIKey();
  const run_url = `https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`;
  const options = {
    method: "GET",
    headers: { 
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    }
  }

try {
    const response = await fetch(run_url, options);
    const run = await response.json();

    return run;
  } catch(error) {throw error;}
}

async function submitToolOutputs(run, outputs) {
  const API_KEY = await fetchAPIKey();
  const url = `https://api.openai.com/v1/threads/${run.thread_id}/runs/${run.id}/submit_tool_outputs`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({
      tool_outputs: outputs
    })
  };

  try {
    const response = await fetch(url, options);
    const modified_run = await response.json();

    console.log(modified_run);

    return modified_run;
  } catch (error) {throw error;}
}

async function handleRequiresAction(run) {
  if (run.required_action &&
      run.required_action.submit_tool_outputs &&
      run.required_action.submit_tool_outputs.tool_calls) {

      const tool_outputs = await Promise.all(run.required_action.submit_tool_outputs.tool_calls.map(async (tool) => {
          if (tool.function.name === "getUpcomingLaunches") {
            return {
              tool_call_id: tool.id,
              output: JSON.stringify(await getUpcomingLaunches())
            }
          }
        }
      ));
     
      if (tool_outputs.length > 0)
        return await submitToolOutputs(run, tool_outputs);
    }
}

async function run(assistant_id, thread_id, prompt) {
  sendToBox(await createMessage(thread_id, prompt));
  let run = await createRun(assistant_id, thread_id);
  
  while (true) {
    run = await retrieveRun(thread_id, run.id);
    console.log(run);
    
    switch (run.status) {
      case "completed":
      case "incomplete":
        const assistant_message = await retrieveLastMessage(thread_id);
        sendToBox(assistant_message);
        console.log(assistant_message);
        
        return run;
      case "requires_action":
        console.log(run);
        await handleRequiresAction(run);
        break;
      case "queued":
      case "in_progress":
      case "cancelling":
        break;
      default: return run;
    }
  }
}

async function startSession() {
  assistant_obj = await searchAssistantByName(assistant_options.name);

  if (typeof assistant_obj === "undefined")
    assistant_obj = await createAssistant(assistant_options);

  thread_obj = await createThread();
}

async function restoreChatBox(thread_id) {
  const messages = await listMessages(thread_id);

  messages.data.reverse().forEach((message) => sendToBox(message));
}

async function handleUserInput() {
    const user_input = document.querySelector('#user-input').value.trim();

    if (user_input === '') return;
    
    document.querySelector('#user-input').value = '';
    
    if (thread_obj === null || thread_obj === undefined)
      await startSession();
      
    return await run(assistant_obj.id, thread_obj.id, user_input);
}

document.querySelector("#chatbot-btn").addEventListener("click", openChat);
document.querySelector('#send-btn').addEventListener('click', handleUserInput);
document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// ---------------------------------------------- SpaceX Rest API -------------------------------------------------
async function getUpcomingLaunches() {
  const url = "https://api.spacexdata.com/v5/launches/upcoming";

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data.slice(0,3);
  } catch (error) {throw error;}
}
