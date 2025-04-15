import { clsx, type ClassValue } from "clsx"
import { CursorPosition } from "../app/maze/page";
import { twMerge } from "tailwind-merge"
import ReactDOM from 'react-dom/client';
import { EmojiDisplay } from '../components/emojiSelector';
import React from "react";


export type EmojiData ={
  userId: string;
  emojiText: string;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleSocket(userId: string, username: string, curPos: CursorPosition, myId: string | null, currImg: string | null) {
  const maze = document.getElementById("MAZE");
  if (userId == myId) return;

  let childElement = maze?.querySelector<HTMLDivElement>(`#${CSS.escape(userId)}`)

  if (childElement) {
    // Update position if cursor element already exists
    childElement.style.top = `${curPos.y - 40}px`
    childElement.style.left = `${curPos.x - 17}px`
  } else {

    // Create new cursor element
    childElement = document.createElement("div")
    childElement.id = userId
    childElement.className = "otherCursor"

    // Position the new cursor
    childElement.style.position = "absolute"
    childElement.style.top = `${curPos.y - 40}px`
    childElement.style.left = `${curPos.x - 17}px`

    // Optional: Style cursor
    childElement.style.width = "40px"
    childElement.style.height = "40px"
    // You can also add custom visuals like a username tag or emoji here
    childElement.title = `${username} (${userId})`;
    childElement.style.backgroundImage = `url('${currImg}')`;
    childElement.style.backgroundSize = "cover";
    childElement.style.backgroundPosition = "center";
    maze?.appendChild(childElement)
  }

}

export function handleUserLeft(userId: string) {
  const maze = document.getElementById("MAZE");
  const childElement = maze?.querySelector<HTMLDivElement>(`#${CSS.escape(userId)}`)
  console.log(CSS.escape(userId))
  console.log(userId)
  console.log(childElement)
  if (childElement) childElement.remove();
}

export function handleEmojiChange(emoji: EmojiData) {
  const maze = document.getElementById("MAZE");

  if (maze) {
    const childElement = maze.querySelector(`#${CSS.escape(emoji.userId)}`) as HTMLElement | null;

    if (childElement) {
      const existingEmojii = childElement.querySelector(`.emojii-${CSS.escape(emoji.userId)}`) as HTMLElement | null;

      if (!existingEmojii) {
        const emojiel = document.createElement('div');
        emojiel.className = `emojii-${CSS.escape(emoji.userId)}`;

        const root = ReactDOM.createRoot(emojiel);
        root.render(<EmojiDisplay selectedEmoji={ emoji.emojiText } />);
        childElement.appendChild(emojiel);

        setTimeout(() => {
          const toRemove = childElement.querySelector(`.emojii-${CSS.escape(emoji.userId)}`);
          if (toRemove) {
            toRemove.remove();
          }
        }, 7000);
      } else {
        // If emoji already exists, remove and re-add it
        existingEmojii.remove();

        const emojiel = document.createElement('div');
        emojiel.className = `emojii-${CSS.escape(emoji.userId)}`;

        const root = ReactDOM.createRoot(emojiel);
        root.render((<EmojiDisplay selectedEmoji={ CSS.escape(emoji.emojiText) } />));
        childElement.appendChild(emojiel);

        setTimeout(() => {
          const toRemove = childElement.querySelector(`.emojii-${CSS.escape(emoji.userId)}`);
          if (toRemove) {
            toRemove.remove();
          }
        }, 7000);
      }
    }
  }

}

