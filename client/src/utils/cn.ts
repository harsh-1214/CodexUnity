import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateConverter = (timestamp : Date) => {
  const timestampNum = Math.round(new Date(timestamp).getTime() / 1000);
  const date = new Date(timestampNum * 1000);
  const now = new Date();

  const diff = now.getTime() - date.getTime();
  const diffInSeconds = diff / 1000;
  const diffInMinutes = diffInSeconds / 60;
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;

  switch (true) {
    case diffInDays > 7:
      return `${Math.floor(diffInDays / 7)} weeks ago`;
    case diffInDays >= 1 && diffInDays <= 7:
      return `${Math.floor(diffInDays)} days ago`;
    case diffInHours >= 1:
      return `${Math.floor(diffInHours)} hours ago`;
    case diffInMinutes >= 1:
      return `${Math.floor(diffInMinutes)} minutes ago`;
    default:
      return 'Just now';
  }
};

export const getCircleStyle = (index:any) => {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
  return `${colors[index % colors.length]}`;
};

const colors = [
  '#FFADAD', // Light Red
  '#FFD6A5', // Peach
  '#FDFFB6', // Light Yellow
  '#CAFFBF', // Light Green
  '#9BF6FF', // Light Cyan
  '#A0C4FF', // Light Blue
  '#BDB2FF', // Light Purple
  '#FFC6FF', // Light Pink
  '#FFB5E8', // Light Magenta
  '#FFCF9F'  // Light Orange
];

export function stringToColor(str : string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}


export function formatDateToString(date : Date) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month}, ${hours}:${minutes}`
}