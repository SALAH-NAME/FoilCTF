
import	express							from 'express';
import	bcrypt							from 'bcrypt';
import	jwt							from 'jsonwebtoken';
import	{ ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, PORT}	from './utils/env';

const	app = express();

console.log(ACCESS_TOKEN_SECRET);
console.log(REFRESH_TOKEN_SECRET);

app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
})
