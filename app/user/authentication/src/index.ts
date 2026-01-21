
import	express	from 'express';
import	bcrypt	from 'bcrypt';
import	jwt	from 'jsonwebtoken';
import	{ ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET }	from './utils/env';

const	app = express();

console.log(ACCESS_TOKEN_SECRET);
console.log(REFRESH_TOKEN_SECRET);

app.listen(3000, () => {
	console.log('app listening on port 3000');
})
