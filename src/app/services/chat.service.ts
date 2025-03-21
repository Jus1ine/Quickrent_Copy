import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ChatMessage {
  content: string;
  type: 'sent' | 'received';
  time: string;
}

export interface ChatContact {
  id: string;
  type: string;
  name: string;
  time: string;
  seen: boolean;
  content: string;
  unread: number;
  avatar: string;
  conversation: ChatMessage[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private contacts = new BehaviorSubject<ChatContact[]>([]);
  contacts$ = this.contacts.asObservable();

  constructor() {}

  addContact(contact: ChatContact) {
    const currentContacts = this.contacts.value;
    const existingContactIndex = currentContacts.findIndex(c => c.id === contact.id);
    
    if (existingContactIndex !== -1) {
      // Update existing contact
      currentContacts[existingContactIndex] = {
        ...currentContacts[existingContactIndex],
        ...contact,
        conversation: [
          ...currentContacts[existingContactIndex].conversation,
          ...contact.conversation
        ]
      };
      this.contacts.next([...currentContacts]);
    } else {
      // Add new contact
      this.contacts.next([...currentContacts, contact]);
    }
  }

  addMessage(contactId: string, content: string, isSent: boolean) {
    const currentContacts = this.contacts.value;
    const contactIndex = currentContacts.findIndex(c => c.id === contactId);
    
    if (contactIndex !== -1) {
      const message: ChatMessage = {
        content,
        type: isSent ? 'sent' : 'received',
        time: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }).toLowerCase()
      };

      currentContacts[contactIndex].conversation.push(message);
      currentContacts[contactIndex].content = content;
      currentContacts[contactIndex].time = message.time;
      
      if (!isSent) {
        currentContacts[contactIndex].unread += 1;
      }

      this.contacts.next([...currentContacts]);
    }
  }

  getMessages(contactId: string): ChatMessage[] {
    const contact = this.contacts.value.find(c => c.id === contactId);
    return contact ? contact.conversation : [];
  }
} 