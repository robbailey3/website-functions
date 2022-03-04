const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
require('dotenv').config({ path: '../../.env' });

const getFile = async (bucketName, fileName) => {
	console.log(`Getting file ${fileName} from bucket ${bucketName}`);
	const storage = new Storage();

	const bucket = storage.bucket(bucketName);

	const file = bucket.file(fileName);

	console.log(`Downloading file ${fileName} from bucket ${bucketName}`);
	const downloadResponse = await file.download();
	console.log(`Downloaded file with length ${downloadResponse[0].length}`);

	return downloadResponse[0];
};

const resizeFile = async (file) => {
	console.log('Resizing file');
	return await sharp(file).resize({ width: 1920 }).toBuffer();
};

const generateThumbnail = async (file) => {
	console.log('Generating thumbnail');
	return await sharp(file).resize({ width: 25 }).toBuffer();
};

const saveFile = async (bucketName, fileName, file) => {
	console.log(`Saving file ${fileName} to bucket ${bucketName}`);
	const storage = new Storage();

	const bucket = storage.bucket(bucketName);

	const fileUpload = bucket.file(fileName);

	await fileUpload.save(file);
	console.log(`Saved file ${fileName} to bucket ${bucketName}`);
};

const deleteFile = async (bucketName, fileName) => {
	console.log(`Deleting file ${fileName} from bucket ${bucketName}`);
	const storage = new Storage();

	const bucket = storage.bucket(bucketName);

	const file = bucket.file(fileName);

	await file.delete();
};

exports.onImageUpload = async (obj, context) => {
	try {
		console.log(`Event received for ${obj.name} at ${Date.now()}`);
		const file = await getFile(obj.bucket, obj.name);

		const resized = await resizeFile(file);

		const folderName = obj.name.split('/')[0];
		const fileName = obj.name.split('/')[1];

		await saveFile(process.env.DEST_BUCKET_NAME, `${folderName}/${fileName}`, resized);

		const thumbnail = await generateThumbnail(file);

		await saveFile(process.env.DEST_BUCKET_NAME, `${folderName}/thumbnail_${fileName}`, thumbnail);

		await deleteFile(obj.bucket, obj.name);
	} catch (error) {
		console.log(error);
	}
};
