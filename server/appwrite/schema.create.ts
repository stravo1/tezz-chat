import { createAllSchemas } from './schema';

// Run the schema creation
createAllSchemas()
    .then(() => {
        console.log('Schema creation completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to create schemas:', error);
        process.exit(1);
    }); 