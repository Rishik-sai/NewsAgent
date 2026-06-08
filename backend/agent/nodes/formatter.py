from langchain_core.messages import SystemMessage, HumanMessage
from agent.llm import get_llm
from agent.state import NewsAgentState

def format_response(state: NewsAgentState) -> dict:
    intent = state.get("intent", "chat")
    translated = state.get("translated_articles", [])
    messages = state.get("messages", [])
    topic = state.get("topic", "")
    language = state.get("language", "en-in")
    agent_type = state.get("agent_type", "general").capitalize()
    
    last_query = messages[-1].content if messages else ""
    
    # Basic translations for static UI strings from the backend
    lang_code = language.split('-')[0].lower() if language else 'en'
    
    dict_greeting = {
        'es': "¡Hola!", 'fr': "Bonjour!", 'hi': "नमस्ते!", 'en': "Hello!"
    }
    dict_no_articles_greet = {
        'es': "No se encontraron artículos.", 'fr': "Aucun article trouvé.", 'hi': "कोई लेख नहीं मिला।", 'en': "No articles found."
    }
    dict_no_articles_msg = {
        'es': f"Busqué noticias sobre \"{topic or last_query}\", pero no encontré resultados. ¡Prueba con otro tema!",
        'fr': f"J'ai cherché des nouvelles sur \"{topic or last_query}\", mais je n'ai rien trouvé. Essayez un autre sujet!",
        'hi': f"मैंने \"{topic or last_query}\" के बारे में समाचार खोजा, लेकिन कोई परिणाम नहीं मिला। कृपया कोई अन्य विषय आज़माएँ!",
        'en': f"I searched for news about \"{topic or last_query}\", but couldn't find relevant results. Try a different topic!"
    }
    dict_pref_greet = {
        'es': "¡Preferencias actualizadas!", 'fr': "Préférences mises à jour!", 'hi': "प्राथमिकताएं अपडेट की गईं!", 'en': "Preferences Updated!"
    }
    dict_pref_msg = {
        'es': "He guardado tus preferencias.", 'fr': "J'ai enregistré vos préférences.", 'hi': "मैंने आपकी प्राथमिकताएं सहेज ली हैं।", 'en': "I have recorded your preferences. I'll use these to personalize your news experience."
    }
    
    greeting = dict_greeting.get(lang_code, dict_greeting['en'])
    message = ""
    follow_up = ""
    
    if intent == "search":
        if translated:
            topic_label = topic if topic else last_query
            greeting_map = {
                'es': f"¡Aquí tienes lo que encontré sobre \"{topic_label}\"!",
                'fr': f"Voici ce que j'ai trouvé sur \"{topic_label}\"!",
                'hi': f"\"{topic_label}\" पर मुझे यह मिला!",
                'en': f"Here's what I found on \"{topic_label}\"!"
            }
            greeting = greeting_map.get(lang_code, greeting_map['en'])
            
            llm = get_llm(temperature=0.7, streaming=True)
            if llm:
                try:
                    articles_text = "\n\n".join(
                        f"Headline: {a.get('headline')}\nSource: {a.get('source')}\nSummary: {a.get('summary')}\nLink: {a.get('url')}"
                        for a in translated[:5]
                    )
                    search_prompt = (
                        f"You are a friendly AI {agent_type} News Assistant. Summarize the following news articles into a cohesive, conversational overview. "
                        f"CRITICAL INSTRUCTION: You must write your entire summary IN THE TARGET LANGUAGE corresponding to this language code: '{language}'. "
                        f"Highlight the most important points relevant to a {agent_type} context. "
                        f"You MUST include inline Markdown links to the original sources (e.g. [Read more on CNN](https://cnn.com/...) or just inline [CNN](https://...)). "
                        f"Keep it concise and engaging. End your response by asking if they want to know about another topic, IN THE TARGET LANGUAGE."
                    )
                    response = llm.invoke(
                        [
                            SystemMessage(content=search_prompt),
                            HumanMessage(content=f"User's query: {last_query}\n\nArticles:\n{articles_text}")
                        ],
                        config={"tags": ["formatter_llm"]}
                    )
                    message = response.content.strip()
                except Exception as e:
                    print(f"Error formatting search response with LLM: {e}")
                    message = f"I gathered {len(translated)} news articles for you."
            else:
                message = f"I gathered {len(translated)} news articles for you."
                
            follow_up = "\n\nIs there anything else you'd like to know? You can ask about another topic, a different date range, or change your language preference."
        else:
            greeting = dict_no_articles_greet.get(lang_code, dict_no_articles_greet['en'])
            message = dict_no_articles_msg.get(lang_code, dict_no_articles_msg['en'])
    elif intent == "preference":
        greeting = dict_pref_greet.get(lang_code, dict_pref_greet['en'])
        message = dict_pref_msg.get(lang_code, dict_pref_msg['en'])
    else:
        # Conversational / chit-chat
        llm = get_llm(temperature=0.7, streaming=True)
        if llm:
            try:
                chat_prompt = (
                    f"You are a friendly, conversational AI {agent_type} News Assistant. The user is chatting or asking a general question. "
                    "Provide a warm, helpful response. Keep it under 3 sentences. "
                    f"CRITICAL INSTRUCTION: You must write your entire response IN THE TARGET LANGUAGE corresponding to this language code: '{language}'. "
                    f"Always end by mentioning you can fetch and translate {agent_type.lower()} news on any topic they're interested in, IN THE TARGET LANGUAGE."
                )
                response = llm.invoke([
                    SystemMessage(content=chat_prompt),
                    HumanMessage(content=last_query)
                ], config={"tags": ["formatter_llm"]})
                message = response.content.strip()
            except Exception as e:
                print(f"Error formatting chat response with LLM: {e}")
                
    response_payload = {
        "greeting": greeting,
        "message": message + follow_up,
        "articles": translated
    }
    
    return {"response": response_payload}
