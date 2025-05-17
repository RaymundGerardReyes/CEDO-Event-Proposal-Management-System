// backend/tests/dbconfig.test.js

const mongoose = require("mongoose");
// connectDB will be required inside beforeEach after resetting modules
let connectDB;

// Mock the entire mongoose module. This is hoisted.
jest.mock("mongoose");

describe("Database Connection (connectDB utility)", () => {
    const ORIGINAL_ENV = { ...process.env }; // Store original environment variables

    // Define the default connection object that connectDB would return on success (based on mock)
    const mockSuccessfulConnection = {
        connection: {
            host: 'testhost', // Default mock host
        },
    };

    // Define the actual options connectDB passes to mongoose.connect
    const actualConnectionOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    const defaultMongoURI = "mongodb://localhost:27017/partnership-proposals";

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV };
        jest.clearAllMocks();

        // Mock implementation for mongoose.connect
        mongoose.connect = jest.fn().mockResolvedValue({
            connection: {
                host: 'testhost', // Mock host value
                on: jest.fn(), // Mock the 'on' method
            },
        });

        mongoose.connection = {
            on: jest.fn(),
        };

        connectDB = require("../utils/db");
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV; // Restore original environment variables
    });

    it("should connect to MongoDB successfully using MONGODB_URI and return the connection object", async () => {
        process.env.MONGODB_URI = "mongodb://customhost/customdb";
        const customMockConnection = { connection: { host: 'customhost-from-mock' } };
        // Override default mock for this specific test case if needed for return value/logging
        mongoose.connect.mockResolvedValue(customMockConnection);
        // Update mongoose.connection.host if the log message depends on it for this specific mock
        mongoose.connection.host = customMockConnection.connection.host;


        await expect(connectDB()).resolves.toEqual(customMockConnection);

        expect(mongoose.connect).toHaveBeenCalledTimes(1);
        expect(mongoose.connect).toHaveBeenCalledWith(
            "mongodb://customhost/customdb",
            actualConnectionOptions // connectDB always passes its defined options object
        );
    });

    it("should call mongoose.connect with the defined options from connectDB", async () => {
        process.env.MONGODB_URI = "mongodb://testhost/db_with_options";
        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(
            process.env.MONGODB_URI,
            expect.objectContaining(actualConnectionOptions)
        );
    });

    it("should use the default URI if MONGODB_URI is not defined", async () => {
        delete process.env.MONGODB_URI; // Ensure MONGODB_URI is not set

        await connectDB(); // Should fall back to the default URI

        expect(mongoose.connect).toHaveBeenCalledTimes(1);
        expect(mongoose.connect).toHaveBeenCalledWith(
            defaultMongoURI, // The default URI from connectDB.js
            actualConnectionOptions
        );
    });

    describe("Connection Error Handling", () => {
        it("should handle connection errors from mongoose.connect and re-throw the error", async () => {
            process.env.MONGODB_URI = "mongodb://testhost/db_that_will_fail";
            const connectionError = new Error("Simulated Mongoose Connection Failed");
            mongoose.connect.mockRejectedValueOnce(connectionError);

            await expect(connectDB()).rejects.toThrow(connectionError);

            expect(mongoose.connect).toHaveBeenCalledTimes(1);
            expect(mongoose.connect).toHaveBeenCalledWith(
                process.env.MONGODB_URI,
                actualConnectionOptions
            );
        });

        it("should log an error message to console.error on mongoose.connect failure", async () => {
            process.env.MONGODB_URI = "mongodb://testhost/db_for_error_logging";
            const connectionError = new Error("Simulated DB Error for Logging");
            mongoose.connect.mockRejectedValueOnce(connectionError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            try {
                await connectDB();
            } catch (error) {
                // Expected path due to re-throw
            }

            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            // connectDB.js logs: `Error connecting to MongoDB: ${error.message}`
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                `Error connecting to MongoDB: ${connectionError.message}`
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe("Success Logging", () => {
        it("should log a success message to console.log on successful connection", async () => {
            process.env.MONGODB_URI = "mongodb://testhost/db_for_success_logging";
            // connectDB uses the host from the `conn.connection.host` which comes from mongoose.connect's resolved value
            const specificMockConnection = { connection: { host: 'success-log-host' } };
            mongoose.connect.mockResolvedValue(specificMockConnection);
            // Update mongoose.connection.host as well if any part of connectDB directly uses it (though log uses conn.connection.host)
            mongoose.connection.host = specificMockConnection.connection.host;

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            await connectDB();

            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            // connectDB.js logs: `MongoDB Connected: ${conn.connection.host}`
            expect(consoleLogSpy).toHaveBeenCalledWith(
                `MongoDB Connected: ${specificMockConnection.connection.host}`
            );

            consoleLogSpy.mockRestore();
        });
    });

    describe("Event Listener Registration", () => {
        it("should register 'error' and 'disconnected' event listeners on mongoose.connection", async () => {
            process.env.MONGODB_URI = "mongodb://testhost/testdb_events";
            await connectDB(); // This will execute the logic that sets up listeners

            expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
            // To check count, be more specific if other tests might also call .on (though beforeEach clears mocks)
            expect(mongoose.connection.on).toHaveBeenCalledTimes(2); // Called for 'error' and 'disconnected'
        });
    });

    // Example for testing SIGINT (process event) - more advanced
    describe("SIGINT Handler", () => {
        let originalProcessOn;
        let sigintCallback;

        beforeEach(() => {
            originalProcessOn = process.on;
            process.on = jest.fn((event, cb) => {
                if (event === 'SIGINT') {
                    sigintCallback = cb;
                }
            });
            // Re-require connectDB so it uses the mocked process.on
            jest.resetModules();
            mongoose.connect = jest.fn().mockResolvedValue(mockSuccessfulConnection);
            mongoose.connection = {
                on: jest.fn(),
                close: jest.fn().mockResolvedValue(undefined),
                host: mockSuccessfulConnection.connection.host,
            };
            connectDB = require("../utils/db");

        });

        afterEach(() => {
            process.on = originalProcessOn; // Restore original process.on
            sigintCallback = null;
        });

        it("should attempt to close mongoose connection on SIGINT", async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { });


            await connectDB(); // This sets up the process.on('SIGINT') listener

            expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));

            // Simulate SIGINT event if a callback was captured
            if (sigintCallback) {
                await sigintCallback(); // Execute the SIGINT handler
            }


            expect(mongoose.connection.close).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledWith("MongoDB connection closed due to app termination");
            expect(processExitSpy).toHaveBeenCalledWith(0);


            consoleLogSpy.mockRestore();
            processExitSpy.mockRestore();
        });
    });
});