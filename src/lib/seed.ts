import { collection, writeBatch, getDocs, doc, Firestore } from "firebase/firestore";
import { courses } from "./courses";

const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "River", "Jamie", "Skyler", "Quinn", "Rowan"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const noteTitles = [
    "Key Concepts of Cellular Respiration", "Summary of the French Revolution", "Introduction to Python Data Types",
    "Analysis of 'The Great Gatsby'", "Principles of Macroeconomics: Supply and Demand", "Solving Linear Equations",
    "The Structure of an Atom", "Understanding Shakespearean Sonnets", "Causes of World War I",
    "Foundations of Human Psychology", "Java vs. Python: A Comparison", "The Basics of Photosynthesis",
    "Exploring the Roman Empire", "Key Themes in '1984'", "Newton's Laws of Motion Explained",
    "The Role of the Federal Reserve", "Introduction to Object-Oriented Programming", "Geometry Basics: Angles and Lines",
    "Chemical Bonding: Ionic and Covalent", "The American Civil Rights Movement"
];
const questionTitles = [
    "How does photosynthesis work?", "What were the main causes of the Civil War?", "Can someone explain recursion in simple terms?",
    "What is the best way to factor a polynomial?", "What's the difference between ionic and covalent bonds?", "Help with 'To Kill a Mockingbird' theme",
    "How do I balance this chemical equation?", "What is the significance of the Magna Carta?", "Why is the sky blue?",
    "Can you explain the concept of 'id' in Psychology?", "What is Big O notation?", "How to solve for x in this equation?",
    "What are the main functions of a cell membrane?", "What led to the fall of the Roman Empire?",
    "Need help understanding the electoral college.", "What is the meaning of the green light in The Great Gatsby?",
    "How does a bill become a law?", "What are the differences between DNA and RNA?", "Explain the theory of relativity.",
    "What are the ethical implications of AI?"
];

const contentCorpus = [
    "This is a detailed summary of the main points from the lecture on Monday. It covers all topics that will be on the upcoming exam.",
    "I was struggling with this concept, so I made some notes to clarify it for myself. Hope this helps others too!",
    "Here's a quick cheat sheet for the formulas we need to know for the final. Let me know if I missed anything.",
    "Does anyone have a good way to remember these dates? I'm having a hard time keeping them straight.",
    "I'm stuck on problem #5 on the homework. Can anyone explain how to get started? I've attached a picture of the problem.",
    "The professor mentioned this would be a bonus question on the test, so I'm sharing my notes on it. Good luck everyone!",
    "Just a quick question about the reading. On page 52, the author says... but I thought the lecture said the opposite. Which one is correct?",
    "This is a very high-level overview of the chapter. I'd recommend reading the full chapter, but this is good for a quick review.",
    "I found a really helpful YouTube video that explains this topic well. Here's the link: [link]",
    "Here are my thoughts on the discussion question. What do you all think? Am I on the right track?"
];

const commentCorpus = [
    "This is super helpful, thank you!",
    "I was just about to ask about this.",
    "Great explanation, it makes so much more sense now.",
    "Could you clarify the part about the second step?",
    "I have a different take on this, what if we consider...",
    "Thanks for sharing!",
    "This saved me so much time.",
    "I'm still a little confused, can you give another example?",
];


function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(): Date {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomTags(): { class: string; topic: string }[] {
    const numTags = Math.floor(Math.random() * 2) + 1; // 1 to 2 tags
    const tags = [];
    const usedClasses: string[] = [];

    for (let i = 0; i < numTags; i++) {
        let course = getRandomElement(courses);
        // Ensure we don't add the same class twice
        while (usedClasses.includes(course.name)) {
            course = getRandomElement(courses);
        }
        usedClasses.push(course.name);

        const unit = getRandomElement(course.units);
        tags.push({ class: course.name, topic: unit });
    }
    return tags;
}

async function clearCollection(db: Firestore, collectionPath: string) {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


export async function seedDatabase(db: Firestore) {
    // 1. Clear existing data
    const notesSnapshot = await getDocs(collection(db, "notes"));
    for (const noteDoc of notesSnapshot.docs) {
        await clearCollection(db, `notes/${noteDoc.id}/comments`);
        await deleteDoc(doc(db, "notes", noteDoc.id));
    }
    
    const questionsSnapshot = await getDocs(collection(db, "questions"));
    for (const questionDoc of questionsSnapshot.docs) {
        await clearCollection(db, `questions/${questionDoc.id}/comments`);
        await clearCollection(db, `questions/${questionDoc.id}/answers`);
        await deleteDoc(doc(db, "questions", questionDoc.id));
    }

    // 2. Get users to be authors
    const usersSnapshot = await getDocs(collection(db, "users"));
    if (usersSnapshot.empty) {
        throw new Error("No users found in the database. Please create a user first.");
    }
    const users = usersSnapshot.docs.map(d => ({
        id: d.id,
        name: `${d.data().firstName} ${d.data().lastName}`,
        avatar: d.data().photoURL,
        fallback: `${d.data().firstName?.charAt(0) || ''}${d.data().lastName?.charAt(0) || ''}`
    }));

    // 3. Generate new data in a batch
    const batch = writeBatch(db);

    // Generate 10 Notes
    for (let i = 0; i < 10; i++) {
        const noteRef = doc(collection(db, "notes"));
        const user = getRandomElement(users);
        batch.set(noteRef, {
            title: getRandomElement(noteTitles),
            content: getRandomElement(contentCorpus),
            tags: getRandomTags(),
            date: getRandomDate(),
            authorId: user.id,
            authorName: user.name,
            isPublic: true,
            upvotes: Math.floor(Math.random() * 50),
            downvotes: Math.floor(Math.random() * 10),
            attachmentURL: "",
            attachmentName: "",
        });

        // Add comments to note
        const numComments = Math.floor(Math.random() * 3);
        for (let j = 0; j < numComments; j++) {
            const commentUser = getRandomElement(users);
            const commentRef = doc(collection(db, "notes", noteRef.id, "comments"));
            batch.set(commentRef, {
                authorId: commentUser.id,
                authorName: commentUser.name,
                authorAvatar: commentUser.avatar,
                authorFallback: commentUser.fallback,
                content: getRandomElement(commentCorpus),
                date: getRandomDate(),
                upvotes: Math.floor(Math.random() * 10),
                downvotes: Math.floor(Math.random() * 2),
            });
        }
    }

    // Generate 10 Questions
    for (let i = 0; i < 10; i++) {
        const questionRef = doc(collection(db, "questions"));
        const user = getRandomElement(users);
        const numAnswers = Math.floor(Math.random() * 4) + 1;
        batch.set(questionRef, {
            title: getRandomElement(questionTitles),
            content: getRandomElement(contentCorpus),
            tags: getRandomTags(),
            authorId: user.id,
            author: user.name,
            avatar: user.avatar,
            fallback: user.fallback,
            date: getRandomDate(),
            views: Math.floor(Math.random() * 200),
            replies: numAnswers,
            upvotes: Math.floor(Math.random() * 30),
            downvotes: Math.floor(Math.random() * 5),
            attachmentURL: "",
            attachmentName: "",
        });

        // Add answers to question
        for (let k = 0; k < numAnswers; k++) {
            const answerUser = getRandomElement(users);
            const answerRef = doc(collection(db, 'questions', questionRef.id, "answers"));
            batch.set(answerRef, {
                author: answerUser.name,
                authorId: answerUser.id,
                avatar: answerUser.avatar,
                fallback: answerUser.fallback,
                content: getRandomElement(contentCorpus),
                date: getRandomDate(),
                upvotes: Math.floor(Math.random() * 15),
                downvotes: Math.floor(Math.random() * 3),
                isAccepted: false,
            });
        }
    }
    
    // 4. Commit the batch
    await batch.commit();
}
