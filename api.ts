import express from 'express';
import {pipeline, Readable} from 'stream';
import {Transform} from 'node:stream';
import figlet from 'figlet';
import {Comment} from './models/comment';
import {Post} from "./models/post";

const app = express();
const port = 3000;
const badWords: string[] = ['necessitatibus', 'repellat', 'badword3'];

// Middleware to parse JSON request bodies
app.use(express.json());

function removeBadWords(input: string): string {
    let output = input;
    badWords.forEach((word) => {
        const regex = new RegExp(word, 'gi');
        output = output.replace(regex, '*'.repeat(word.length));
    });
    return output;
}

function processPipeline(inputStream: Readable, res: express.Response) {
    const transformStream = new Transform({
        transform(chunk, encoding, callback) {
            const output = removeBadWords(chunk.toString());
            callback(null, output);
        }
    });

    pipeline(
        inputStream,
        transformStream,
        res,
        (err) => {
            if (err) {
                console.error('Pipeline failed:', err);
                res.status(500).send('Pipeline failed');
            } else {
                console.log('Pipeline completed successfully.');
            }
        }
    );
}

app.get('/api/palabritas/comentarios', (req, res) => {
    const comments: Comment[] = req.body;

    const readable = new Readable({
        read() {
            comments.forEach(comment => {
                this.push(comment.name);
                this.push(comment.body);
            });
            this.push(null);
        }
    });

    processPipeline(readable, res);
});

app.get('/api/palabritas/publicaciones', (req, res) => {
    const posts: Post[] = req.body;

    const readable = new Readable({
        read() {
            posts.forEach(post => {
                this.push(post.title);
                this.push(post.body);
            });
            this.push(null);
        }
    });

    processPipeline(readable, res);
});

const start = () => {
    app.listen(port, () => {
        figlet('Palabritas API by mesita', (err, data) => {
            if (err) {
                console.error('Error generating ASCII art:', err);
                return;
            }
            console.log(data);
            console.log(`Server is running on http://localhost:${port}`);
        });
    });
};

start();